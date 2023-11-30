import type { RouteRecordNormalized } from 'vue-router';

export interface AppState {
    theme: string;
    colorWeak: boolean;
    navbar: boolean;
    menu: boolean;
    topMenu: boolean;
    hideMenu: boolean;
    menuCollapse: boolean;
    footer: boolean;
    themeColor: string;
    menuWidth: number;
    layoutSetting: boolean; // 是否开启布局配置的入口
    routerTransition: boolean;
    globalSettings: boolean;
    device: string;
    tabBar: boolean;
    menuFromServer: boolean;
    serverMenu: RouteRecordNormalized[];
    [key: string]: unknown;
}
