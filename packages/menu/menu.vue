<!--
 * User: CHT
 * Date: 2020/5/25
 * Time: 9:12
-->
<template>
  <div class="super-flow__menu-container">
    <div
      v-show="visible"
      class="flow__menu-mask"
      @mousemove.stop.prevent
      @mousedown="close">
    </div>
    <ul
      v-show="visible"
      tabindex="-1"
      class="super-flow__menu"
      @mousemove.stop.prevent
      @contextmenu.prevent.stop
      @blur="close"
      :style="style">
      <template v-for="subList in list">
        <li
          class="super-flow__menu-item"
          v-for="subItem in subList"
          :class="{'is-disabled': subItem.disable}"
          @click="select(subItem)">
          <slot :item="subItem">
            <span class="super-flow__menu-item-icon"></span>
            <span class="super-flow__menu-item-content">
              {{subItem.label}}
            </span>
          </slot>
        </li>
        <li class="super-flow__menu-line"></li>
      </template>
    </ul>
  </div>

</template>


<script lang='ts'>
  import main from './menu.ts'
  export default main
</script>

<style lang="less">
  @import './menu.less';
</style>
