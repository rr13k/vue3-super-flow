<!--
 * User: CHT
 * Date: 2020/5/27
 * Time: 9:52
-->
<template>
  <div
    class="super-flow"
    id="superflow"
    ref="superflow"
    @mousedown="dargCanvas"
    @mousemove="dargCanvas"
    @mouseup="dargCanvas"
    @wheel="zoomEvent"
    :style="`zoom: ${cZoom}`"
    @contextmenu.prevent.stop="contextmenu">

    <graph-line
      v-if="temEdgeConf.visible"
      :padding="linkPadding"
      :graph="graph"
      :link="temEdgeConf.link"
      :link-base-style="linkBaseStyle"
      :link-desc="linkDesc"
      :link-style="linkStyle">
    </graph-line>

    <graph-line
      v-for="(edge, idx) in graph.linkList"
      :index="idx"
      :padding="linkPadding"
      :graph="graph"
      :link="edge"
      :key="edge.key"
      :link-base-style="linkBaseStyle"
      :link-desc="linkDesc"
      :link-style="linkStyle">
    </graph-line>

    <mark-line
      v-if="moveNodeConf.isMove && hasMarkLine"
      :width="clientWidth"
      :height="clientHeight"
      :mark-color="markLineColor"
      :markLine="moveNodeConf.markLine">
    </mark-line>

    <graph-node
      v-for="(node, idx) in graph.nodeList"
      :index="idx"
      :node="node"
      :graph="graph"
      :key="node.key"
      :is-move="node === moveNodeConf.node"
      :is-tem-edge="temEdgeConf.visible"
      :node-intercept="nodeIntercept(node)"
      :line-drop="linkAddable"
      :node-drop="draggable"
      :drift="drift"
      @node-mousedown="nodeMousedown"
      @node-mouseenter="nodeMouseenter"
      @node-mouseleave="nodeMouseleave"
      @node-mouseup="nodeMouseup"
      @side-mousedown="sideMousedown"
      @node-contextmenu="nodeContextmenu">
      <template v-slot="{meta}"  >
        <slot
          name="node"
          :meta="meta">
        </slot>
      </template>
    </graph-node>

    <graph-menu
      v-model:visible="menuConf.visible"
      :graph="graph"
      :position="menuConf.position"
      :list="menuConf.list"
      :source="menuConf.source">
      <template v-slot="{item}">
        <slot
          name="menuItem"
          :item="item">
        </slot>
      </template>
    </graph-menu>

    <div
      class="select-all__mask"
      ref="selectAllMask"
      tabindex="-1"
      :style="maskStyle"
      @blur="graph.graphSelected = false"
      v-show="graph.graphSelected"
      @mousedown="selectAllMaskMouseDown"
      @contextmenu.prevent.stop>
    </div>
  </div>
</template>

<script lang='ts'>
  import main from './index.ts'
  export default main
</script>

<style  lang="less">
  @import './index.less';
</style>


