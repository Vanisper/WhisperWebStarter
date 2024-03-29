<template>
  <div class="air-tool-bar">
    <div class="air-tool-bar--left">
      <slot name="beforeButton" />
      <AButton v-if="props.entity && !hideAdd"
        :permission="addPermission || CorePermission.getPermission(entity, CorePermissionAction.ADD)" primary type="ADD"
        @click="emits('onAdd')">
        {{ addTitle }}
      </AButton>
      <AButton v-if="showImport"
        :permission="importPermission || CorePermission.getPermission(entity, CorePermissionAction.IMPORT)" type="IMPORT"
        @click="onImport()">
        导入
      </AButton>
      <slot name="afterButton" />
    </div>
    <div class="air-tool-bar--right">
      <slot name="beforeSearch" />
      <template v-if="isSearchEnabled">
        <el-input v-model="keyword" v-tip="searchPlaceholder" :placeholder="placeholderForSearch" class="keyword"
          @keydown.enter="onSearch">
          <template #suffix>
            <el-icon v-if="keyword" style="margin-right:6px;" @click="keyword = ''; onSearch()">
              <CircleClose />
            </el-icon>
            <el-icon style="vertical-align: middle" @click="onSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </template>
      <template v-if="isFilterEnabled">
        <div class="advance-search">
          <el-button :class="searchAnimation" @click.stop="keyword = ''; showDialog = !showDialog">
            <i class="airpower icon-commonicon_gengduoshaixuan" />{{ searchTitle }}
          </el-button>
          <div v-if="showDialog" class="advance-search-bg" :title="'点击关闭' + searchTitle" @click="hideFilterDialog" />
          <transition name="search">
            <div v-if="showDialog" class="advance-search-dialog">
              <div class="advance-search-title">
                <div class="advance-search-title-label">
                  {{ searchTitle }}
                </div>
                <div class="advance-search-title-close" @click="hideFilterDialog">
                  <i class="airpower icon-commonicon_guanbi" />
                </div>
              </div>
              <div class="advance-search-form">
                <el-form ref="formRef" label-width="auto" :model="filter">
                  <template v-for=" item in searchFieldList " :key="item.key">
                    <el-form-item v-if="!item.hide" :label="item.label">
                      <slot :name="item.key" :data="filter">
                        <template v-if="item.between">
                          <el-date-picker v-if="item.betweenType === CoreBetweenType.DATE" v-model="filter[item.key]"
                            :editable="false" type="daterange" range-separator="至" start-placeholder="开始日期"
                            end-placeholder="结束日期" format="YYYY/MM/DD" value-format="x" :default-time="[
                              new Date(1991, 10, 3, 0, 0, 0),
                              new Date(1991, 10, 3, 23, 59, 59),
                            ]
                            " />
                          <el-time-picker v-if="item.betweenType === CoreBetweenType.TIME" v-model="filter[item.key]"
                            is-range arrow-control :editable="false" range-separator="至" start-placeholder="开始时间"
                            end-placeholder="结束时间" value-format="HH:mm:ss" />
                          <el-date-picker v-if="item.betweenType === CoreBetweenType.DATETIME" v-model="filter[item.key]"
                            type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间"
                            format="YYYY/MM/DD HH:mm:ss" :editable="false" value-format="x" :default-time="[
                              new Date(1991, 10, 3, 0, 0, 0),
                              new Date(1991, 10, 3, 23, 59, 59),
                            ]
                            " />

                          <el-slider v-if="item.betweenType === CoreBetweenType.NUMBER" v-model="filter[item.key]" range
                            :min="item.betweenMin ?? 0" :max="item.betweenMax ?? 100" />
                        </template>

                        <el-select v-else-if="item.dictionary && item.dictionary.length > 0" v-model="filter[item.key]"
                          :placeholder="'请选择' + item.label + '...'" clearable :filterable="item.filterable"
                          @clear="filter[item.key] = undefined">
                          <template v-for=" enumItem of item.dictionary ">
                            <el-option v-if="!enumItem.disabled" :key="(enumItem.key as string)" :value="enumItem.key"
                              :label="enumItem.label" />
                          </template>
                        </el-select>

                        <el-select v-else-if="getDictionary(entityInstance, item.key)" v-model="filter[item.key]"
                          :placeholder="'请选择' + item.label + '...'" clearable :filterable="item.filterable"
                          @clear="filter[item.key] = undefined">
                          <template v-for=" enumItem of getDictionary(entityInstance, item.key) ">
                            <el-option v-if="!enumItem.disabled" :key="(enumItem.key as string)" :value="enumItem.key"
                              :label="enumItem.label" />
                          </template>
                        </el-select>
                        <el-input-number v-else-if="item.dataType === CoreSearchDataType.NUMBER"
                          v-model.number="filter[item.key]" :placeholder="'请输入' + item.label + '...'"
                          :type="getInputType(item)" :controls="false" />
                        <el-input v-else v-model="filter[item.key]" :placeholder="'请输入' + item.label + '...'" clearable
                          :type="getInputType(item)" @clear="filter[item.key] = undefined" />
                      </slot>
                    </el-form-item>
                  </template>
                </el-form>
              </div>
              <div class="advance-search-footer">
                <el-button type="primary" @click="onFilterConfirm">
                  确定筛选
                </el-button>
                <el-button @click="
                  onResetSearch();
                hideFilterDialog()
                                    ">
                  重置筛选
                </el-button>
              </div>
            </div>
          </transition>
        </div>
      </template>
      <AButton v-if="showExport"
        :permission="exportPermission || CorePermission.getPermission(entity, CorePermissionAction.EXPORT)" type="EXPORT"
        custom-class="export-button" @click="onExport()">
        导出
      </AButton>
      <slot name="afterSearch" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
    PropType, ref, computed,
} from 'vue';

import { AButton } from '../component';
import { CoreDialog } from '../helper/CoreDialog';
import { getEntityConfig } from '../decorator/EntityConfig';
import { CoreConfig } from '../config/CoreConfig';
import { CoreSearchDataType } from '../enum/CoreSearchDataType';
import { CoreNotification } from '../feedback/CoreNotification';
import { CoreClassTransformer } from '../helper/CoreClassTransformer';
import { CoreSearchFieldConfig } from '../config/CoreSearchFieldConfig';
import { CoreFormInstance } from '../type/CoreType';
import { CoreBetweenType } from '../enum/CoreBetweenType';
import { CorePermissionAction } from '../enum/CorePermissionAction';
import { CorePermission } from '../helper/CorePermission';
import { IFile } from '../interface/IFile';
import { CoreEntity } from '../base/CoreEntity';
import { CoreRequestPage } from '../model/CoreRequestPage';
import { ClassConstructor } from '../type/ClassConstructor';
import { CoreRequest } from '../model/CoreRequest';
import { IJson } from '../interface/IJson';
import { getDictionary } from '../decorator/Custom';
import { CoreAbstractEntityService } from '../base/CoreAbstractEntityService';

const emits = defineEmits(['onSearch', 'onAdd', 'onReset']);

const props = defineProps({
    /**
   * # 左侧添加按钮的权限标识
   * ---
   * 则默认使用 ```EntityConfig``` 的 ```addPermission``` 配置
   */
    addPermission: {
        type: String,
        default: undefined,
    },

    /**
   * # 右侧导出按钮的权限标识
   * ---
   * 则默认使用 ```EntityConfig``` 的 ```exportPermission``` 配置
   */
    exportPermission: {
        type: String,
        default: undefined,
    },

    /**
   * # 左侧导入按钮的权限标识
   * ---
   * 则默认使用 ```EntityConfig``` 的 ```importPermission``` 配置
   */
    importPermission: {
        type: String,
        default: undefined,
    },

    /**
   * # 搜索的对象
   * ---
   * 则覆盖自动生成的条件
   */
    searchParams: {
        type: Array as unknown as PropType<CoreSearchFieldConfig[]>,
        default: undefined,
    },

    /**
   * # 加载的状态
   */
    loading: {
        type: Boolean,
        default: false,
    },

    /**
   * # 实体类
   */
    entity: {
        type: Function as unknown as PropType<ClassConstructor<CoreEntity>>,
        required: true,
    },

    /**
   * # 是否显示搜索框
   * ---
   * 💡 优先级: Entity配置 > 组件传入
   */
    showSearch: {
        type: Boolean,
        default: undefined,
    },

    /**
   * # 是否显示更多筛选器
   * ---
   * 💡 优先级: 组件传入 > EntityConfig配置
   */
    showFilter: {
        type: Boolean,
        default: undefined,
    },

    /**
   * # 隐藏添加按钮
   */
    hideAdd: {
        type: Boolean,
        default: undefined,
    },

    /**
   * # 导出接口地址 如传入则优先使用
   * 默认按传入的service自动生成
   */
    exportUrl: {
        type: String,
        default: undefined,
    },

    /**
   * # 导出的请求参数
   */
    exportParam: {
        type: Object as PropType<CoreRequest>,
        default: undefined,
    },

    /**
   * # 是否显示导出按钮
   * ---
   * 💡 如传入 则需要再传入 ```:service``` 或 ```:export-url```
   */
    showExport: {
        type: Boolean,
        default: false,
    },

    /**
   * # 异步导出
   * ---
   * 💡 建议数据量大的导出功能都使用这个方法
   */
    exportAsync: {
        type: Boolean,
        default: false,
    },

    /**
   * # 导入接口地址
   * ---
   * 💡 默认按传入的service自动生成
   */
    importUrl: {
        type: String,
        default: undefined,
    },

    /**
   * # 导入模板下载地址
   * ---
   * 💡 默认按传入的service自动生成
   */
    importTemplateUrl: {
        type: String,
        default: undefined,
    },

    /**
   * # 导入上传的标题
   * ---
   * 💡 默认按传入的service自动生成
   */
    importTitle: {
        type: String,
        default: undefined,
    },

    /**
   * # 是否显示导入按钮
   * ---
   * - ```import-url``` [可选]导入的API接口地址
   * - ```import-title``` [可选]指定上传框的标题
   */
    showImport: {
        type: Boolean,
        default: false,
    },

    /**
   * # 导入的文件实体类
   * ---
   * 💡 可通过 ```CoreConfig.fileEntityClass``` 配置, 默认为 ```CoreFileEntity```
   */
    fileEntity: {
        type: Function as unknown as PropType<ClassConstructor<IFile>>,
        default: CoreConfig.fileEntityClass,
    },

    /**
   * # 接口服务类
   */
    service: {
        type: Function as unknown as PropType<ClassConstructor<CoreAbstractEntityService<CoreEntity>>>,
        required: true,
    },

    /**
   * # 搜索框提示文案
   * ---
   * 💡 优先级: 组件传入 > EntityConfig配置 > CoreConfig默认值
   */
    searchPlaceholder: {
        type: String,
        default: undefined,
    },
});

/**
 * # Entity的实例
 */
const entityInstance = computed(() => {
    if (props.entity) {
        try {
            return CoreClassTransformer.newInstance(props.entity);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('AToolBar创建实体的实例失败');
        }
    }
    return new CoreEntity();
});

/**
 * 表单
 */
const formRef = ref<CoreFormInstance>();

/**
 * 是否显示高级搜索表单
 */
const showDialog = ref(false);

/**
 * 高级搜索按钮动画
 */
const searchAnimation = ref('');

/**
 * 内部使用的配置
 */
const entityConfig = computed(() => getEntityConfig(entityInstance.value));

/**
 * 高级搜索按钮标题
 */
const searchTitle = '更多筛选';

/**
 * 查询对象
 */
const request = ref(new CoreRequestPage(props.entity));

/**
 * 添加按钮的标题
 */
const addTitle = computed(() => entityConfig.value.addTitle || (`添加${entityInstance.value.getClassName()}`));

/**
 * 搜索框提示文字
 */
const placeholderForSearch = computed(() => props.searchPlaceholder || entityConfig.value.searchPlaceholder || CoreConfig.searchPlaceholder);

/**
 * 是否显示搜索框
 */
const isSearchEnabled = computed(() => props.showSearch ?? entityConfig.value.showSearch ?? false);

/**
 * 是否显示更多筛选器
 */
const isFilterEnabled = computed(() => props.showFilter ?? entityConfig.value.showFilter ?? false);

/**
 * 为URL拼接AccessToken
 * @param url
 */
function getUrlWithAccessToken(url: string) {
    const accessToken = CoreConfig.getAccessToken();
    url = url.replace('authorization', 'Authorization');
    if (url.indexOf('?Authorization=') < 0 && url.indexOf('&Authorization=') < 0) {
        if (url.indexOf('?') < 0) {
            url += `?Authorization=${accessToken}`;
        } else {
            url += `&Authorization=${accessToken}`;
        }
    }
    return url;
}

/**
 * 导出方法
 */
function onExport() {
    let url = props.exportUrl;
    if (!url) {
    // 没有自定义传入 则自动生成
        if (!props.service) {
            CoreNotification.error('请为ToolBar传入service或者exportUrl', '导出失败');
            return;
        }
        const service = CoreClassTransformer.newInstance(props.service);
        url = `${service.baseUrl}/${props.exportAsync ? CoreConfig.exportUrl : CoreConfig.exportSyncUrl}`;
    }
    if (props.exportAsync) {
        CoreDialog.createExportTask(url, request.value);
        return;
    }
    window.open(CoreConfig.apiUrl + getUrlWithAccessToken(url));
}

/**
 * # 下载导入的模板
 */
function onDownloadTemplate() {
    let url = props.importTemplateUrl;
    if (url) {
        window.open(CoreConfig.apiUrl + getUrlWithAccessToken(url));
        return;
    }

    // 没有自定义传入 则自动生成
    if (!props.service) {
        CoreNotification.error('请为ToolBar传入service或者importTemplateUrl', '下载失败');
        return;
    }

    const service = CoreClassTransformer.newInstance(props.service);
    url = `${service.baseUrl}/${CoreConfig.importTemplateUrl}`;
    if (url.indexOf('https://') < 0 && url.indexOf('http://') <= 0) {
        url = CoreConfig.apiUrl + url;
    }
    window.open(getUrlWithAccessToken(url));
}

/**
 * 高级搜索字段列表
 */
const searchFieldList = computed(() => props.searchParams || entityInstance.value.getSearchFieldConfigList());

/**
 * 查询用的临时JSON
 */
const filter = ref({} as IJson);

/**
 * 查询用的关键词
 */
const keyword = ref('');

/**
 * 高级搜索
 */
function onFilterConfirm() {
    // 删除关键词搜索数据
    keyword.value = '';
    request.value.keyword = keyword.value;
    request.value.filter = CoreClassTransformer.newInstance(props.entity).recoverBy(filter.value);
    emits('onSearch', request.value);
}

/**
 * 关键词搜索
 */
function onSearch() {
    // 删除高级搜索的数据
    filter.value = {};
    request.value.keyword = keyword.value;
    request.value.exclude('filter');
    emits('onReset');
    emits('onSearch', request.value);
}

/**
 * 重置表单
 */
function onResetSearch() {
    filter.value = {};
    keyword.value = '';
    request.value = new CoreRequestPage(props.entity);
    request.value.exclude('filter');
    emits('onReset');
    emits('onSearch', request.value);
}

/**
 * 导入
 */
async function onImport() {
    let url = props.importUrl;
    if (!url) {
    // 没有自定义传入 则自动生成
        if (!props.service) {
            CoreNotification.error('请为ToolBar传入service或者importUrl', '导入失败');
            return;
        }
        const service = CoreClassTransformer.newInstance(props.service);
        url = `${service.baseUrl}/${CoreConfig.importUrl}`;
        if (url.indexOf('https://') < 0 && url.indexOf('http://') <= 0) {
            url = CoreConfig.apiUrl + url;
        }
    }
    await CoreDialog.showUpload(
        {
            uploadUrl: url,
            exts: ['xls', 'xlsx'],
            title: props.importTitle || '导入数据',
            uploadSuccess: '数据导入成功',
            confirmText: '下载模板',
            entity: CoreConfig.fileEntityClass,
        },
        () => {
            onDownloadTemplate();
        },
    );
    onResetSearch();
}

/**
 * 获取输入的类型
 */
function getInputType(item: CoreSearchFieldConfig) {
    switch (item.dataType) {
    case CoreSearchDataType.TEXTAREA:
        return 'textarea';
    case CoreSearchDataType.NUMBER:
        return 'number';
    default:
        return 'text';
    }
}

/**
 * 隐藏高级搜索(触发动画)
 */
function hideFilterDialog() {
    showDialog.value = false;
    searchAnimation.value = 'search-button-animation';
    setTimeout(() => {
        searchAnimation.value = '';
    }, 500);
}

/**
 * 暴露一个重置搜索的方法
 */
defineExpose({ resetSearch: onResetSearch });

</script>

<style lang="scss">
.air-tool-bar {
  padding: 0 0 20px 0;
  display: flex;

  .el-button+.el-button {
    margin-left: 5px;
  }

  .export-button {
    margin-left: 5px;
  }

  .el-input-number {
    .el-input__inner {
      text-align: left;
    }
  }

  &--left {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex: 1;

    .airpower {
      margin-right: 5px;
    }
  }

  &--right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    .keyword {
      cursor: pointer;
      width: 300px;
      margin-right: 5px;

      .el-icon {
        transition: all 0.3s;
      }

      .el-icon:hover {
        color: var(--primary-color);
      }
    }

    .advance-search-bg {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.05);
      z-index: 10001;
    }

    .search-button-animation {
      animation: jump-in 0.2s infinite;
      animation-delay: 0.3s;
    }

    .advance-search {
      position: relative;

      .airpower {
        margin-right: 5px;
      }

      .advance-search-dialog {
        position: absolute;
        right: 0px;
        top: 0px;
        z-index: 10002;
        background: white;
        box-shadow: 0px 0px 20px rgb(0 0 0 / 20%);
        border-radius: 6px;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        min-width: 500px;

        .advance-search-title {
          padding: 15px 15px 20px 20px;
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .advance-search-title-label {
          flex: 1;
        }

        .advance-search-title-close {
          transition: all 0.3s;
          cursor: pointer;
          font-size: 18px;
        }

        .advance-search-title-close:hover {
          color: var(--primary-color);
        }

        .advance-search-form {
          flex: 1;
          height: 0;
          overflow: hidden;
          overflow-y: auto;
          padding: 20px;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;

          .el-input,
          .el-input-number {
            max-width: 100% !important;
          }

        }

        .advance-search-footer {
          padding: 15px;
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
        }
      }
    }

    .el-button-group {
      display: inline-flex;
    }

    &--search {
      width: 300px;

      .el-input-group__append {
        background-color: transparent;

        &:hover {
          color: #f39800;
        }
      }

      .el-input__inner {
        &:focus {
          border-color: var(--el-input-hover-border,
              var(--el-border-color-hover)) !important;
        }
      }
    }
  }

  .search-btn {
    margin: 0 10px;
  }

  .reset-btn {
    margin-left: 0px;
  }
}
</style>
