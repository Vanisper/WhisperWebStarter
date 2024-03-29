<template>
  <div class="air-input">
    <template v-if="fieldConfig && fieldConfig.dateType !== undefined">
      <el-date-picker v-if="fieldConfig.dateType !== CoreDateTimeType.TIME" v-model="value" :placeholder="placeholderRef"
        :clearable="fieldConfig?.clearable" :disabled="disabled" :prefix-icon="fieldConfig?.prefixIcon"
        :suffix-icon="fieldConfig?.suffixIcon" :format="fieldConfig.dateShowFormatter || getShowFormatter"
        :value-format="fieldConfig.dateFormatter" :type="fieldConfig.dateType" style="width:100%" :readonly="readonly"
        @change="selectEvent" @visible-change="selectEvent" @keydown="inputKeyDown" />
      <el-time-picker v-else v-model="value" style="width:100%" :placeholder="placeholderRef"
        :clearable="fieldConfig?.clearable" :disabled="disabled" :prefix-icon="fieldConfig?.prefixIcon"
        :suffix-icon="fieldConfig?.suffixIcon" :format="fieldConfig.dateShowFormatter || CoreDateTimeFormatter.HH_mm_ss"
        :value-format="fieldConfig.dateFormatter" :readonly="readonly" @change="selectEvent" @visible-change="selectEvent"
        @keydown="inputKeyDown" />
    </template>
    <template v-else-if="dictionary || (fieldConfig && fieldConfig.dictionary) || list">
      <el-switch v-if="fieldConfig?.switch" v-model="value" :readonly="readonly" :style="{
        '--el-switch-on-color': getSwitchColor('on'),
        '--el-switch-off-color': getSwitchColor('off')
      }" :active-text="!fieldConfig.hideSwitchLabel && (fieldConfig?.dictionary || dictionary)?.find(
  item => item.key === true
)?.label
  || ''" :inactive-text="!fieldConfig.hideSwitchLabel && (fieldConfig?.dictionary || dictionary)?.find(
    item => item.key === false
  )?.label
    || ''" @change="selectEvent" />
      <el-radio-group v-else-if="fieldConfig?.radioButton" v-model="value" :readonly="readonly" @change="selectEvent">
        <template v-if="list">
          <el-radio-button v-for="item in list" :key="item.key" :label="item.key">
            {{ item.label }}
          </el-radio-button>
        </template>
        <template v-else>
          <el-radio-button v-for="item in (fieldConfig.dictionary || dictionary)" :key="item.key" :label="item.key">
            {{ item.label }}
          </el-radio-button>
        </template>
      </el-radio-group>
      <el-radio-group v-else-if="fieldConfig?.radio" v-model="value" :readonly="readonly" @change="selectEvent">
        <template v-if="list">
          <el-radio v-for="item in list" :key="item.key" :label="item.key">
            {{ item.label }}
          </el-radio>
        </template>
        <template v-else>
          <el-radio v-for="item in (fieldConfig.dictionary || dictionary)" :key="item.key" :label="item.key">
            {{ item.label }}
          </el-radio>
        </template>
      </el-radio-group>
      <el-select v-else v-model="value" :readonly="readonly" :placeholder="placeholderRef"
        :clearable="fieldConfig?.clearable" :disabled="disabled" :prefix-icon="fieldConfig?.prefixIcon"
        :suffix-icon="fieldConfig?.suffixIcon" :multiple="fieldConfig?.multiple"
        :multiple-limit="fieldConfig?.multipleLimit" fit-input-width :collapse-tags="fieldConfig?.collapseTags"
        :filterable="fieldConfig?.filterable" :remote-method="onSearch" :remote="!!onSearch" collapse-tags-tooltip
        @keydown="inputKeyDown" @change="selectEvent">
        <template v-if="list">
          <el-option v-for="item in list" :key="(item.key as string)" :label="item.label" :value="item.key"
            :disabled="item.disabled" />
        </template>
        <template v-else-if="dictionary">
          <el-option v-for="item in dictionary" :key="(item.key as string)" :label="item.label" :value="item.key"
            :disabled="item.disabled" />
        </template>
        <template v-else-if="fieldConfig">
          <el-option v-for="item in fieldConfig.dictionary" :key="(item.key as string)" :label="item.label"
            :value="item.key" :disabled="item.disabled" />
        </template>
      </el-select>
    </template>

    <el-cascader v-else-if="(fieldConfig && tree)" v-model="value" class="air-input-cascader" :options="tree"
      :readonly="readonly" popper-class="air-input-cascader-popper" :placeholder="placeholderRef"
      :clearable="fieldConfig?.clearable" :show-all-levels="fieldConfig?.showAllLevels" :props="{
        value: 'id',
        label: 'name',
        multiple: fieldConfig?.multiple,
        emitPath: fieldConfig?.emitPath,
        checkStrictly: fieldConfig?.checkStrictly
      }" :disabled="disabled" :collapse-tags="fieldConfig?.collapseTags" collapse-tags-tooltip @change="selectEvent"
      @keydown="inputKeyDown" />
    <el-input v-else v-model="value" :readonly="readonly" :placeholder="placeholderRef"
      :clearable="fieldConfig?.clearable" :disabled="disabled" :maxlength="fieldConfig?.maxLength || (fieldConfig?.textarea
        ? CoreConfig.maxTextAreaLength :
        CoreConfig.maxTextLength)
      " :max="fieldConfig?.max" :min="fieldConfig?.min ?? 0" :show-word-limit="getShowWordLimit()" :type="getInputType"
      :rows="fieldConfig?.textarea ? CoreConfig.textareaMinRows : 0" :prefix-icon="fieldConfig?.prefixIcon"
      :suffix-icon="fieldConfig?.suffixIcon" :autosize="fieldConfig?.autoSize ?
        { minRows: fieldConfig.minRows, maxRows: fieldConfig.maxRows }
        : false
      " @keydown="inputKeyDown" @change="inputEvent" @blur="inputBlur">
      <template v-if="fieldConfig && fieldConfig.suffixText" #append>
        <slot name="append">
          {{ fieldConfig?.suffixText }}
        </slot>
      </template>
      <template #suffix>
        <el-icon v-if="isClearButtonShow" @click="clearEvent()">
          <CircleClose />
        </el-icon>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import {
  PropType, Ref, ref, watch, computed,
} from 'vue'

import { CoreModel } from '../base/CoreModel'
import { CoreFormFieldConfig } from '../config/CoreFormFieldConfig'
import { CoreConfig } from '../config/CoreConfig'
import { CoreDateTimeFormatter } from '../enum/CoreDateTimeFormatter'
import { CoreDateTimeType } from '../enum/CoreDateTimeType'
import { IDictionary } from '../interface/IDictionary'
import { CoreValidator } from '../helper/CoreValidator'
import { CoreTrim } from '../enum/CoreTrim'
import { ClassConstructor } from '../type/ClassConstructor'
import { IJson } from '../interface/IJson'
import { CoreClassTransformer } from '../helper/CoreClassTransformer'
import { CoreEntity } from '../base/CoreEntity'
import { getDictionary } from '../decorator/Custom'
import { ITree } from '../interface/ITree'

const emits = defineEmits(['onChange', 'change', 'update:modelValue', 'onClear', 'clear'])

const props = defineProps({
  modelValue: {
    type: [String, Boolean, Number, Array, Object],
    default: undefined,
  },
  modelModifiers: {
    type: Object,
    default: () => ({}),
  },

  /**
   * # 如果是循环, 则此项必须传入
   * 字段名
   */
  modifier: {
    type: String,
    default: undefined,
  },

  /**
   * # 是否禁用输入
   */
  disabled: {
    type: Boolean,
    default: false,
  },

  /**
   * # 是否只读
   */
  readonly: {
    type: Boolean,
    default: false,
  },

  /**
   * # 禁用时显示的值
   * 如果被禁用时传入了这个值, 则会显示这个值.
   */
  disabledValue: {
    type: [String, Boolean, Number, Array, Object],
    default: undefined,
  },

  /**
   * # 显示的格式化方式
   */
  dateShowFormatter: {
    type: String,
    default: undefined,
  },

  /**
   * # 传入的实体类
   * 如同时传入了```modifier```或```v-model```指令的```modifier``` 则自动生成兜底的```placeholder```等信息
   */
  entity: {
    type: Function as unknown as PropType<ClassConstructor<CoreModel>>,
    default: undefined,
  },

  /**
   * # 自定义提示文字
   * 优先级: ```AInput```传入 > ```@FormField``` > 自动生成
   */
  placeholder: {
    type: String, default: '',
  },

  /**
   * # 可选数组
   * 优先级: ```AInput```传入 > ```@FormField```
   */
  list: {
    type: Object as unknown as PropType<IDictionary[]>,
    default: undefined,
  },

  /**
   * # 可选树结构
   * 优先级: ```AInput```传入 > ```@FormField```
   */
  tree: {
    type: Object as unknown as PropType<ITree[]>,
    default: undefined,
  },

  /**
   * # 是否显示清空的图标
   * 仅在普通输入框的readonly下有效
   */
  showClear: {
    type: Boolean,
    default: false,
  },

  /**
   * # 远程搜索的回调方法
   * 如传入 则会回调此方法进行自定义搜索
   */
  onSearch: {
    type: Function,
    default: null,
  },
})

/**
 * # 实体的实例
 */
const entityInstance = computed(() => {
  if (props.entity) {
    return CoreClassTransformer.parse({}, props.entity)
  }
  return new CoreEntity()
})

/**
 * 是否显示清空按钮
 */
const isClearButtonShow = ref(props.showClear)

/**
 * 占位内容
 */
const placeholderRef = ref(props.placeholder)

/**
 * 绑定的数据
 */
const value: Ref<string | number | boolean | Array<unknown> | IJson | undefined> = ref(props.modelValue)

/**
 * 字段的表单配置信息
 */
const fieldConfig: Ref<CoreFormFieldConfig | null> = ref(null)

/**
 * # 字段名称
 */
const fieldName = ref('')

/**
 * 枚举数据
 */
const dictionary = computed(() => {
  if (props.entity && fieldName.value) {
    return getDictionary(entityInstance.value, fieldName.value)
  }
  return undefined
})

/**
 * 值变化同步
 */
function setValue(newProps?: typeof props) {
  if (newProps) {
    if (newProps.disabled) {
      // disabled
      value.value = newProps.disabledValue === undefined
        ? newProps.modelValue
        : newProps.disabledValue
    } else {
      value.value = newProps.modelValue
    }
  } else {
    value.value = props.modelValue
  }
}

/**
 * # 获取显示的格式化
 */
const getShowFormatter = computed(() => {
  if (fieldConfig.value) {
    switch (fieldConfig.value?.dateType) {
      case CoreDateTimeType.DATE:
        return CoreDateTimeFormatter.YYYY_MM_DD
      case CoreDateTimeType.WEEK:
        return '第ww周'
      case CoreDateTimeType.YEAR:
        return 'YYYY'
      case CoreDateTimeType.MONTH:
        return 'YYYY-MM'
      default:
    }
  }
  return CoreConfig.dateTimeFormatter
})

/**
 * # 获取switch的颜色
 * @param status
 */
function getSwitchColor(status: 'on' | 'off') {
  if (fieldConfig.value?.disableSwitchColor) {
    return ''
  }
  if (fieldConfig.value?.dictionary) {
    return fieldConfig.value?.dictionary.find((item) => item.key === (status === 'on'))?.color || ''
  }

  if (dictionary.value) {
    return dictionary.value.find((item) => item.key === (status === 'on'))?.color || ''
  }
  return ''
}

/**
 * # 获取是否显示字符长度的显示label
 */
function getShowWordLimit() {
  if (!fieldConfig.value) {
    // 没有配置装饰器 直接不显示
    return false
  }
  if (fieldConfig.value.showLimit !== undefined) {
    // 配置了装饰器 且配置了属性 直接返回
    return fieldConfig.value.showLimit
  }
  // 配置了装饰器 但没配置属性 读取默认值
  return fieldConfig.value.textarea
    ? CoreConfig.showLengthLimitTextarea
    : CoreConfig.showLengthLimitInput
}

/**
 * 获取输入类型的字符串
 */
const getInputType = computed(() => {
  if (fieldConfig.value?.textarea) {
    return 'textarea'
  }
  if (fieldConfig.value?.password) {
    return 'password'
  }
  if (fieldConfig.value?.number) {
    return 'number'
  }
  return 'text'
})

/**
 * 监听Props变化, 同步数据
 */
watch(props, (newProps) => {
  isClearButtonShow.value = props.showClear
  setValue(newProps)
})

/**
 * 输入事件
 */
function inputEvent() {
  if (fieldConfig.value?.number) {
    // 数字输入
    let tempValue = value.value as number | string | undefined
    const max = fieldConfig.value.max ?? CoreConfig.maxNumber
    const min = fieldConfig.value.min ?? CoreConfig.minNumber
    if (tempValue !== '' && tempValue !== undefined && tempValue !== null && CoreValidator.isNumber(tempValue.toString())) {
      tempValue = parseFloat(tempValue.toString())
      // 按最大值最小值做边界处理
      tempValue = Math.max(tempValue, min)
      tempValue = Math.min(tempValue, max)
      tempValue = parseFloat(
        tempValue.toFixed(
          fieldConfig.value.precision ?? CoreConfig.numberPrecision,
        ),
      )
      value.value = tempValue
    } else {
      // 输入的不是有效数字 直接置空
      tempValue = undefined
      value.value = undefined
    }
  }
}

/**
 * 选择事件
 */
function selectEvent() {
  if (value.value === '' || value.value === null) {
    value.value = undefined
  }
}

/**
 * 清空事件
 */
function clearEvent() {
  emits('onClear')
  emits('clear')
}

/**
 * 将数据丢出去
 */
function emitValue() {
  if (fieldConfig.value && value.value) {
    switch (fieldConfig.value.trim) {
      case CoreTrim.ALL:
        value.value = value.value.toString().trim()
        break
      case CoreTrim.END:
        value.value = value.value.toString().trimEnd()
        break
      default:
    }
  }
  if (fieldConfig.value?.number) {
    value.value = parseFloat(value.value?.toString() || '0')
  }
  emits('onChange', value.value)
  emits('change', value.value)
  emits('update:modelValue', value.value)
}

/**
 * 输入键盘按下事件
 * @param event
 */
function inputKeyDown(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyE':
      if (fieldConfig.value?.number) {
        // 数字类型输入不允许输入科学计数的e
        event.preventDefault()
      }
      break
    case 'Escape':
      if (fieldConfig.value?.clearable) {
        value.value = undefined
        emitValue()
      }
      break
    default:
  }
}

/**
 * 输入框失去焦点
 */
function inputBlur() {
  if (fieldConfig.value && value.value) {
    switch (fieldConfig.value.trim) {
      case CoreTrim.ALL:
        value.value = value.value.toString().trim()
        break
      case CoreTrim.START:
        value.value = value.value.toString().trimStart()
        break
      case CoreTrim.END:
        value.value = value.value.toString().trimEnd()
        break
      default:
    }
  }
  inputEvent()
  emitValue()
}

/**
 * 监听Value变化, 同步数据
 */
watch(value, () => {
  emitValue()
})

/**
 * 初始化
 */
function init() {
  if (props.modifier) {
    // 如传入了自定义的modifier 则优先使用
    fieldName.value = props.modifier
  } else {
    // eslint-disable-next-line guard-for-in
    for (const key in props.modelModifiers) {
      fieldName.value = key
    }
  }

  // 初始化配置信息
  if (props.entity && fieldName.value) {
    fieldConfig.value = entityInstance.value.getCustomFormFieldConfig(fieldName.value)

    if (!placeholderRef.value) {
      const field = fieldConfig.value?.label
        || entityInstance.value.getFieldName(fieldName.value)
      // 默认生成输入的placeholder
      placeholderRef.value = `请输入${field}...`

      if (fieldConfig.value) {
        // 装饰了FormField
        if (
          dictionary.value || fieldConfig.value.dictionary
          || props.list
          || props.tree
          || fieldConfig.value.dateType !== undefined
        ) {
          // 传入了枚举值
          placeholderRef.value = `请选择${field}...`
        }
        if (fieldConfig.value.placeholder) {
          // 传入了自定义placeholder
          placeholderRef.value = fieldConfig.value.placeholder
        }
      }
    }
  }
  if (props.modelValue === undefined && fieldConfig.value?.defaultValue !== undefined) {
    // 没有初始化的值 但装饰器设置了默认值
    value.value = fieldConfig.value.defaultValue
    emitValue()
    return
  }
  // 初始化同步值
  setValue(props)
}

init()
</script>
<style lang="scss">
.air-input {
  width: 100%;

  .air-input-cascader {
    display: inline;
    width: 100%;
  }

  .air-input-cascader-popper {
    margin-top: 8px !important;

    .el-cascader-menu__list {
      width: 100%;
    }
  }

  .air-input-number {
    .el-input__inner {
      text-align: left;
    }
  }
}
</style>
