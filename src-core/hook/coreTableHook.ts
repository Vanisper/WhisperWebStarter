import { Ref, ref } from 'vue'
import { CoreEntity } from '../base/CoreEntity'
import { CoreDialog } from '../helper/CoreDialog'
import { CoreRequestPage } from '../model/CoreRequestPage'
import { CoreResponsePage } from '../model/CoreResponsePage'
import { ClassConstructor } from '../type/ClassConstructor'
import { CoreAbstractEntityService } from '../base/CoreAbstractEntityService'
import { CoreClassTransformer } from '../helper/CoreClassTransformer'
import { CoreSort } from '../model/CoreSort'
import { CorePage } from '../model/CorePage'
import { CoreNotification } from '../feedback/CoreNotification'
import { ITableHookOption } from '../interface/ITableHookOption'
import { ITableHookResult } from '../interface/ITableHookResult'

/**
 * # 表格基础Hook
 * @param entityClass 实体类
 * @param serviceClass 表格使用的Service类
 * @param option [可选] 更多配置
 */
export function coreTableHook<E extends CoreEntity, S extends CoreAbstractEntityService<E>>(entityClass: ClassConstructor<E>, serviceClass: ClassConstructor<S>, option: ITableHookOption<E> = {}): ITableHookResult<E, S> {
    const isLoading = ref(false)

    const request = ref(new CoreRequestPage<E>(entityClass)) as Ref<CoreRequestPage<E>>

    const response = ref(new CoreResponsePage<E>()) as Ref<CoreResponsePage<E>>

    const list = ref([] as E[]) as Ref<E[]>

    const entity = CoreClassTransformer.newInstance(entityClass)

    const service = CoreClassTransformer.newInstance(serviceClass)
    service.loading = isLoading

    async function onGetList() {
        let req = request.value
        if (option.beforeSearch) {
            const result = option.beforeSearch(req)
            if (result !== undefined) {
                req = result
            }
        }
        if (option.treeList) {
            list.value = await service.getTreeList(req)
        } else if (!option.unPaginate) {
            response.value = await service.getPage(req)
            list.value = response.value.list
        } else {
            list.value = await service.getList(req)
        }
    }

    async function onSearch(req: CoreRequestPage<E>) {
        request.value = req
        onGetList()
    }

    async function onReloadData() {
        request.value.page.pageNum = 1
        request.value.filter = CoreClassTransformer.newInstance(entityClass)
        onSearch(request.value)
    }

    async function onAdd() {
        if (!option.editView) {
            CoreNotification.warning('请为 useCoreTableList 的 option 传入 editView')
            return
        }
        try {
            await CoreDialog.show(option.editView)
        } finally {
            onReloadData()
        }
    }

    async function onDetail(data: E) {
        if (!option.detailView) {
            CoreNotification.warning('请为 useCoreTableList 的 option 传入 detailView')
            return
        }
        try {
            await CoreDialog.show(option.detailView, data)
        } finally {
            onReloadData()
        }
    }

    async function onSortChanged(sort: CoreSort) {
        request.value.sort = sort
        request.value.page = new CorePage()
        onGetList()
    }

    const selectList = ref([] as E[]) as Ref<E[]>

    async function onSelected(list: E[]) {
        selectList.value = list
    }

    async function onPageChanged(page: CorePage) {
        request.value.page = page
        onGetList()
    }

    onGetList()

    return {
        entity, service, isLoading, response, request, list, selectList, onSearch, onPageChanged, onAdd, onSortChanged, onSelected, onGetList, onDetail, onReloadData,
    } as ITableHookResult<E, S>
}
