<template>
  <el-link v-tip="toolTips" class="air-friend-datetime" :underline="false">
    {{ getDateTimeString }}
  </el-link>
</template>
<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { CoreConfig } from '../config/CoreConfig'
import { CoreDateTimeFormatter } from '../enum/CoreDateTimeFormatter'
import { CoreDateTime } from '../helper/CoreDateTime'

const props = defineProps({
  /**
   * # 毫秒时间戳
   */
  time: {
    type: Number,
    default: 0,
  },

  /**
   * # 时间格式化模板
   * ---
   * 💡 建议使用 ```CoreDateTimeFormatter```
   */
  formatter: {
    type: String as PropType<CoreDateTimeFormatter | string>,
    default: CoreConfig.dateTimeFormatter,
  },

  /**
   * # 是否显示友好时间
   */
  isFriendly: {
    type: Boolean,
    default: false,
  },
})

/**
 * 读取友好时间
 */
const getDateTimeString = computed(() => {
  if (!props.time) {
    return '-'
  }
  if (props.isFriendly) {
    return CoreDateTime.getFriendlyDateTime(props.time)
  }
  return CoreDateTime.formatFromMilliSecond(props.time, props.formatter)
})

/**
 * 提示信息
 */
const toolTips = computed(() => {
  if (!props.time) {
    return '-'
  }
  if (!props.isFriendly) {
    return CoreDateTime.getFriendlyDateTime(props.time)
  }
  return CoreDateTime.formatFromMilliSecond(props.time, props.formatter)
})

</script>
<style lang="scss">
.air-friend-datetime,
.air-friend-datetime * {
  user-select: none !important;

  .is-disabled {
    color: #333;
  }
}
</style>
