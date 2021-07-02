<!--
 * User: CHT
 * Date: 2020/5/25
 * Time: 9:12
-->
<template>
  <div
    tabindex="-1"
    class="super-flow__node"
    :class="{'can-move': nodeDrop}"
    :style="style"
    @mousedown.left="nodeMousedown"
    @mouseenter="nodeMouseenter"
    @mouseleave="nodeMouseleave"
    @mouseup="nodeMouseup"
    @contextmenu.prevent.stop="nodeContextmenu">
    <slot :meta="node.meta"></slot>
    <div
      v-for="(dir, key) in direction"
      v-show="output && lineDrop"
      :class="`node-side node-side-${key}`"
      @contextmenu.stop.prevent
      @mousedown.left.prevent.stop="evt => sideMousedown(evt, dir)">
    </div>
  </div>
</template>


<script lang='ts'>
  import main from './node.ts'
  export default main
</script>

<style  lang="less" scoped>
  @import './node.less';
</style>
