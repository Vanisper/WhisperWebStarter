<template>
  <div class="air-frame">
    <div class="air-header">
      <div class="air-logo">
        <slot name="logo">
          <span>CorePower4T</span>
        </slot>
      </div>
      <div class="air-navigator">
        <slot name="navigator" />
      </div>
      <slot name="user" />
    </div>
    <div class="air-main">
      <div class="air-left" :style="{ width: menuWidth + 'px' }">
        <div v-loading="!menuList" class="air-menu">
          <AMenu v-if="menuList" :menu-list="menuList" />
        </div>
      </div>
      <div class="air-right">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { AMenu } from '.'
import { IMenu } from '../interface/IMenu'

defineProps({
  /**
   * # 左侧宽度
   */
  menuWidth: {
    type: Number,
    default: 250,
  },

  /**
   * # 菜单列表
   * ---
   * ### 💡 请确保传入的数组类型为 ```IMenu``` 的实现类
   */
  menuList: {
    type: Array as PropType<Array<IMenu>>,
    required: true,
  },
})

</script>

<style scoped lang="scss">
.air-frame {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;

  .air-header {
    padding: 0px 15px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    height: 50px;
    border-bottom: 1px solid var(--el-color-primary-light-8);

    .air-logo {
      word-break: keep-all;
      text-align: center;
      cursor: pointer;
      user-select: none;

      span {
        margin-left: 16px;
        font-size: 24px;
        font-weight: bold;
        color: var(--el-color-primary);
        user-select: none;
      }
    }

    .air-navigator {
      flex: 1;
      font-size: 14px;
      color: #aaa;
      display: flex;
      flex-direction: row;
      overflow: hidden;
      width: 0;
      margin: 0px 20px;
      background-color: red;
    }
  }

  .air-main {
    flex: 1;
    height: 0;
    display: flex;
    flex-direction: row;
    background-color: var(--el-color-primary-light-9);

    .air-left {
      display: flex;
      flex-direction: column;
      background: #fff;
      margin: 5px;
      border-radius: 4px;

      .air-menu {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        height: 0;
        overflow: hidden;
        overflow-y: auto;
        padding: 10px;

        .item {
          padding: 5px 15px;
          cursor: pointer;
          transition: all .3s;
          font-size: 14px;
          border-radius: 5px;
          color: var(--el-color-primary);
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;

          i {
            margin-right: 3px;
            font-weight: bold;
          }
        }

        .item:hover {
          background-color: #f5f5f5;
        }
      }

      .air-menu::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }
    }

    .air-right {
      flex: 1;
      width: 0;
      display: flex;
      flex-direction: column;
      background: var(--el-color-primary-light-9);
      margin: 5px;
      margin-left: 0px;
    }
  }
}
</style>
