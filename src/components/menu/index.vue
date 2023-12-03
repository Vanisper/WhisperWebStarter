<script lang="tsx">
import { defineComponent, ref, h, compile, computed, PropType, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, RouteRecordRaw } from 'vue-router';
import type { RouteMeta, RouteRecordNormalized } from 'vue-router';
import { useAppStore } from '@/store';
import { listenerRouteChange } from '@/utils/route-listener';
import { openWindow, regexUrl } from '@/utils';
import useMenuTree from './use-menu-tree';
import usePermission from '@/hooks/permission';
import { cloneDeep } from 'lodash';

export default defineComponent({
    emit: ['collapse'],
    props: {
        detached: {
            type: String as PropType<'top' | 'sub'>,
            default: '',
        },
    },
    setup(props) {
        const { t } = useI18n();
        const appStore = useAppStore();
        const permission = usePermission();
        const router = useRouter();
        const route = useRoute();
        const { menuTree: tMenuTree } = useMenuTree();
        const collapsed = computed({
            get() {
                if (appStore.device === 'desktop') return appStore.menuCollapse;
                return false;
            },
            set(value: boolean) {
                appStore.updateSettings({ menuCollapse: value });
            },
        });
        
        const topMenu = computed(() => appStore.topMenu);
        const detachedMenu = computed(() => appStore.detachedMenu);
        const openKeys = ref<string[]>([]);
        const selectedKey = ref<string[]>([]);
        function menuTreeTravel(_routes: RouteRecordRaw[], layer: number) {
            if (!_routes) return null;
            const collector: any = _routes.map((element) => {
                // no access
                if (!permission.accessRouter(element)) {
                    return null;
                }
                
                if (element.meta?.single && element.children?.length) {
                    return {
                        ...element,
                        name: element.children[0].name,
                        // children: element.meta.hideChildrenInMenu ? [] : element.children,
                        children: [] // single单菜单模式下 不显示子菜单
                    };
                }
                // leaf node
                if (element.meta?.hideChildrenInMenu || !element.children || !element.children.length) {
                    element.children = [];
                    return element;
                }

                // route filter hideInMenu true
                element.children = element.children.filter(
                    (x) => x.meta?.hideInMenu !== true
                );

                // Associated child node
                const subItem = menuTreeTravel(element.children, layer + 1);

                if (subItem.length) {
                    element.children = subItem;
                    return element;
                }
                // the else logic
                if (layer > 1) {
                    element.children = subItem;
                    return element;
                }

                if (element.meta?.hideInMenu === false) {
                    return element;
                }

                return null;
            });
            return collector.filter(Boolean);
        }
        const routeMatched = computed(() => {
            const copyRouter = cloneDeep(route.matched) as RouteRecordNormalized[];
            copyRouter.sort((a: RouteRecordNormalized, b: RouteRecordNormalized) => {
                return (a.meta.order || 0) - (b.meta.order || 0);
            });
            return menuTreeTravel(copyRouter, 0) as RouteRecordRaw[];
        });
        const menuTree = computed(() => {
            if (detachedMenu.value && props.detached === 'top') {
                return tMenuTree.value.map((el) => ({...el, children: []}));
            } else if (detachedMenu.value && props.detached === 'sub') {                
                if (routeMatched.value.length > 1) {
                    const parent = routeMatched.value[0];
                    const children = routeMatched.value[route.matched.length - 1].children;
                    return children?.length ? children : parent.children;
                } else {
                    return routeMatched.value[0].children;
                }
            }
            return tMenuTree.value;
        });

        const goto = (item: RouteRecordRaw) => {
            // Open external link
            if (regexUrl.test(item.path)) {
                openWindow(item.path);
                selectedKey.value = [item.name as string];
                return;
            }
            if (!item.meta) item.meta = {} as RouteMeta;
            // Eliminate external link side effects
            const { hideInMenu, activeMenu } = item.meta as RouteMeta;
            if (route.name === item.name && !hideInMenu && !activeMenu) {
                selectedKey.value = [item.name as string];
                return;
            }
            // Trigger router change
            router.push({
                name: item.name,
            });
        };
        const findMenuOpenKeys = (target: string) => {
            const result: string[] = [];
            let isFind = false;
            const backtrack = (item: RouteRecordRaw, keys: string[]) => {
                if (item.name === target) {
                    isFind = true;
                    result.push(...keys);
                    return;
                }
                if (item.children?.length) {
                    item.children.forEach((el) => {
                        backtrack(el, [...keys, el.name as string]);
                    });
                }
            };
            tMenuTree.value?.forEach((el: RouteRecordRaw) => {
                if (isFind) return; // Performance optimization
                backtrack(el, [el.name as string]);
            });
            return result;
        };
        listenerRouteChange((newRoute) => {
            const { requiresAuth, activeMenu, hideInMenu } = newRoute.meta;
            if (requiresAuth && (!hideInMenu || activeMenu)) {
                const menuOpenKeys = findMenuOpenKeys((activeMenu || newRoute.name) as string);  // 这里得到当前路由从根节点到当前节点的所有节点的name
                
                const keySet = new Set([...menuOpenKeys, ...openKeys.value]);
                openKeys.value = [...keySet];
                if (detachedMenu.value && props.detached === 'top' && routeMatched.value.length > 1) {
                    selectedKey.value = [
                        activeMenu || menuOpenKeys[0],
                    ];
                    return;
                }
                selectedKey.value = [
                    activeMenu || menuOpenKeys[menuOpenKeys.length - 1],
                ];
            }
        }, true);
        const setCollapse = (val: boolean) => {
            if (appStore.device === 'desktop')
                appStore.updateSettings({ menuCollapse: val });
        };

        const renderSubMenu = () => {
            function travel(_route: RouteRecordRaw[] | undefined, nodes = []) {
                if (_route) {
                    _route.forEach((element) => {
                        // This is demo, modify nodes as needed
                        const icon = element?.meta?.icon
                            ? () => h(compile(`<${element?.meta?.icon}/>`))
                            : null;
                        const node = element?.children && element?.children.length !== 0 ? (
                            <a-sub-menu
                                key={element?.name}
                                v-slots={{
                                    icon,
                                    title: () => h(compile(element?.meta?.locale ? t(element?.meta?.locale || '') : (element.meta?.title || element.name as string || ''))),
                                }}
                            >
                                {travel(element?.children)}
                            </a-sub-menu>
                        ) : (
                            <a-menu-item
                                key={element?.name}
                                v-slots={{ icon }}
                                onClick={() => goto(element)}
                            >
                                {element?.meta?.locale ? t(element?.meta?.locale || '') : (element.meta?.title || element.name as string || '')}
                            </a-menu-item>
                        );
                        nodes.push(node as never);
                    });
                }
                return nodes;
            }
            return travel(menuTree.value);
        };

        return () => (
            <a-menu
                mode={(topMenu.value || detachedMenu.value && props.detached == 'top') ? 'horizontal' : 'vertical'}
                v-model:collapsed={collapsed.value}
                v-model:open-keys={openKeys.value}
                show-collapse-button={appStore.device !== 'mobile'}
                auto-open={false}
                selected-keys={selectedKey.value}
                auto-open-selected={true}
                level-indent={34}
                style="height: 100%;width:100%;"
                onCollapse={setCollapse}
            >
                {renderSubMenu()}
            </a-menu>
        );
    },
});
</script>

<style lang="less" scoped>
:deep(.arco-menu-inner) {
    .arco-menu-pop-header {
        white-space: nowrap;
        padding: 0 12px;
    }
    .arco-menu-inline-header {
        display: flex;
        align-items: center;
    }

    .arco-icon {
        &:not(.arco-icon-down) {
            font-size: 18px;
        }
    }
}
</style>
