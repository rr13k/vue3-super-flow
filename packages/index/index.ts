import Graph from "../Graph";
import GraphMenu from "../menu/menu.vue";
import GraphNode from "../node/node.vue";
import GraphLine from "../link/link.vue";
import MarkLine from "../markLine/markLine.vue";
import {reactive} from 'vue'

import {
  getOffset,
  isIntersect,
  isBool,
  isFun,
  vector,
  debounce,
  arrayReplace,
} from "../utils";

export default {
  name: "super-flow",
  props: {
    draggable: {
      type: Boolean,
      default: true,
    },
    linkAddable: {
      type: Boolean,
      default: true,
    },
    linkEditable: {
      type: Boolean,
      default: true,
    },
    hasMarkLine: {
      type: Boolean,
      default: true,
    },
    linkDesc: {
      type: [Function, null],
      default: null,
    },
    linkStyle: {
      type: [Function, null],
      default: null,
    },
    linkBaseStyle: {
      type: Object,
      default: () => ({}),
    },
    markLineColor: {
      type: String,
      default: "#55abfc",
    },
    origin: {
      type: Array,
      default: () => [0, 0],
    },
    nodeList: {
      type: Array,
      default: () => [],
    },
    linkList: {
      type: Array,
      default: () => [],
    },
    graphMenu: {
      type: Array,
      default: () => [],
    },
    nodeMenu: {
      type: Array,
      default: () => [],
    },
    linkMenu: {
      type: Array,
      default: () => [],
    },
    linkPadding: {
      type: Number,
      default: 50,
    },
    enterIntercept: {
      type: Function,
      default: () => true,
    },
    outputIntercept: {
      type: Function,
      default: () => true,
    },
  },
  data() {
    return {
      graph: new Graph({
        width: this.width,
        height: this.height,
        origin: this.origin,
      }),
      menuConf: reactive({
        visible: false,
        position: [0, 0],
        source: null,
        list: [],
      }) ,
      moveNodeConf: {
        isMove: false,
        node: null,
        offset: null,
        verticalList: [],
        horizontalList: [],
        markLine: [],
      },
      moveAllConf: {
        isMove: false,
        downPosition: [0, 0],
      },
      temEdgeConf: reactive({
        visible: false,
        link: null,
      }),
      loaded: false,
      clientWidth: 0,
      clientHeight: 0,
    };
  },
  components: {
    GraphMenu,
    GraphNode,
    GraphLine,
    MarkLine
  },
  computed: {
    maskStyle() {
      const { top, right, bottom, left } = this.graph.maskBoundingClientRect;
      return {
        width: `${right - left}px`,
        height: `${bottom - top}px`,
        top: `${top + this.graph.origin[1]}px`,
        left: `${left + this.graph.origin[0]}px`,
      };
    },
  },
  mounted() {
    console.log('组件执行啦',this.temEdgeConf)
    document.addEventListener("mouseup", this.docMouseup);
    document.addEventListener("mousemove", this.docMousemove);
    this.$nextTick(() => {
      this.graph.initNode(this.nodeList);
      this.graph.initLink(this.linkList);
    });
  },
  beforeUnmount(){
    document.removeEventListener("mouseup", this.docMouseup);
    document.removeEventListener("mousemove", this.docMousemove);
  },
  methods: {
    initMenu(menu, source) {
      return menu
        .map((subList) =>
          subList
            .map((item) => {
              let disable;
              let hidden;

              if (isFun(item.disable)) {
                disable = item.disable(source);
              } else if (isBool(item.disable)) {
                disable = item.disable;
              } else {
                disable = Boolean(item.disable);
              }

              if (isFun(item.hidden)) {
                hidden = item.hidden(source);
              } else if (isBool(item.hidden)) {
                hidden = item.hidden;
              } else {
                hidden = Boolean(item.hidden);
              }

              return {
                ...item,
                disable,
                hidden,
              };
            })
            .filter((item) => !item.hidden)
        )
        .filter((sublist) => sublist.length);
    },

    showContextMenu(position, list, source) {
      if (!list.length) return;

      this.menuConf.position = position
      this.menuConf.list = list
      this.menuConf.source = source

      // this.$set(this.menuConf, "position", position);
      // this.$set(this.menuConf, "list", list);
      // this.$set(this.menuConf, "source", source);
      this.menuConf.visible = true;
    },

    docMouseup(evt) {
      if (this.moveNodeConf.isMove) {
        evt.stopPropagation();
        evt.preventDefault();
      }

      this.moveNodeConf.isMove = false;
      this.moveNodeConf.node = null;
      this.moveNodeConf.offset = null;
      arrayReplace(this.moveNodeConf.markLine, []);

      this.temEdgeConf.visible = false;
      this.temEdgeConf.link = null;

      this.moveAllConf.isMove = false;
    },

    docMousemove(evt) {
      if (this.moveNodeConf.isMove) {
        this.moveNode(evt);
      } else if (this.temEdgeConf.visible) {
        this.moveTemEdge(evt);
      } else if (this.graph.graphSelected) {
        this.moveWhole(evt);
      } else if (this.linkEditable) {
        this.graph.dispatch(
          {
            type: "mousemove",
            evt: evt,
          },
          true
        );
      }
    },

    moveNode(evt) {
      const distance = 10;
      const conf = this.moveNodeConf;
      const origin = this.graph.origin;
      const position = vector(conf.offset)
        .differ(getOffset(evt, this.$el))
        .minus(origin)
        .add([conf.node.width / 2, conf.node.height / 2]).end;

      if (this.hasMarkLine) {
        const resultList = [];
        conf.verticalList.some((vertical) => {
          const x = position[0];
          const result = vertical - distance < x && vertical + distance > x;

          if (result) {
            position[0] = vertical;
            vertical = Math.floor(vertical);
            vertical += origin[0];
            vertical += vertical % 1 === 0 ? 0.5 : 0;
            resultList.push([
              [vertical, 0],
              [vertical, this.clientHeight],
            ]);
          }
          return result;
        });
        conf.horizontalList.some((horizontal) => {
          const y = position[1];
          const result = horizontal - distance < y && horizontal + distance > y;
          if (result) {
            position[1] = horizontal;
            horizontal = Math.floor(horizontal);
            horizontal += origin[1];
            horizontal += horizontal % 1 === 0 ? 0.5 : 0;
            resultList.push([
              [0, horizontal],
              [this.clientWidth, horizontal],
            ]);
          }
          return result;
        });

        arrayReplace(conf.markLine, resultList);
      }

      conf.node.center = position;
    },

    moveTemEdge(evt) {
      this.temEdgeConf.link.movePosition = getOffset(evt, this.$el);
    },

    moveWhole(evt) {
      if (this.moveAllConf.isMove) {
        const offset = vector(this.moveAllConf.downPosition).differ([
          evt.clientX,
          evt.clientY,
        ]).end;
        arrayReplace(
          this.graph.origin,
          vector(this.moveAllConf.origin).add(offset).end
        );
      }
    },

    contextmenu(evt) {
      const mouseonLink = this.graph.mouseonLink;
      const position = getOffset(evt);
      let list, source;

      if (mouseonLink && mouseonLink.isPointInLink(position)) {
        list = this.initMenu(this.linkMenu, mouseonLink);
        source = mouseonLink;
      } else {
        if (mouseonLink) this.graph.mouseonLink = null;
        list = this.initMenu(this.graphMenu, this.graph);
        source = this.graph;
      }

      this.showContextMenu(position, list, source);
    },

    nodeMousedown(node, offset) {
      if (this.draggable) {
        this.clientWidth = this.$el.clientWidth;
        this.clientHeight = this.$el.clientHeight;

        const verticalList = this.moveNodeConf.verticalList;
        const horizontalList = this.moveNodeConf.horizontalList;

        const centerList = this.graph.nodeList
          .filter((item) => item !== node)
          .map((node) => node.center);

        arrayReplace(
          verticalList,
          [...new Set(centerList.map((center) => center[0]))].sort(
            (prev, next) => prev - next
          )
        );

        arrayReplace(
          horizontalList,
          [...new Set(centerList.map((center) => center[1]))].sort(
            (prev, next) => prev - next
          )
        );

        this.moveNodeConf.isMove = true;
        this.moveNodeConf.node = node;
        this.moveNodeConf.offset = offset;
      }
    },

    nodeMouseenter(evt, node, offset) {
      const link = this.temEdgeConf.link;
      if (this.enterIntercept(link.start, node, this.graph)) {
        link.end = node;
        link.endAt = offset;
      }
    },

    nodeMouseleave() {
      this.temEdgeConf.link.end = null;
    },

    nodeMouseup() {
      this.graph.addLink(this.temEdgeConf.link);
    },

    nodeContextmenu(evt, node) {
      const list = this.initMenu(this.nodeMenu, node);
      if (!list.length) return;

      this.menuConf.position = getOffset(evt, this.$el)
      this.menuConf.list = list
      this.menuConf.source = node
      // this.$set(this.menuConf, "position", );
      // this.$set(this.menuConf, "list", list);
      // this.$set(this.menuConf, "source", node);
      this.menuConf.visible = true;
    },

    sideMousedown(evt, node, startAt) {
      console.log('这里打的出来吗1')
      if (this.linkAddable) {
        const link = this.graph.createLink({
          start: node,
          startAt,
        });
        console.log('这里打的出来吗2')
        link.movePosition = getOffset(evt, this.$el);
        console.log('这里打的出来吗3')
        this.temEdgeConf.link = link
        this.temEdgeConf.visible = true;
      }
    },

    nodeIntercept(node) {
      return () => this.outputIntercept(node, this.graph);
    },

    menuItemSelect() {
      this.menuConf.visible = false;
    },

    selectAllMaskMouseDown(evt) {
      this.moveAllConf.isMove = true;
      this.moveAllConf.origin = [...this.graph.origin];
      this.moveAllConf.downPosition = [evt.clientX, evt.clientY];
    },

    selectedAll() {
      this.graph.selectAll();
    },

    toJSON() {
      return this.graph.toJSON();
    },

    getMouseCoordinate(clientX, clientY) {
      const offset = getOffset({ clientX, clientY }, this.$el);
      return vector(offset).minus(this.graph.origin).end;
    },

    addNode(options) {
      return this.graph.addNode(options);
    },
  },
  watch: {
    "graph.graphSelected"() {
      if (this.graph.graphSelected) {
        this.$nextTick(() => {
          this.$refs.selectAllMask.focus();
        });
      }
    },
    "graph.mouseonLink"() {
      if (this.graph.mouseonLink) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "";
      }
    },
    origin() {
      this.graph.origin = this.origin || [];
    },
    nodeList() {
      this.graph.initNode(this.nodeList);
    },
    linkList() {
      this.graph.initLink(this.linkList);
    },
  },
  install(Vue) {
    Vue.component(this.name, this);
  },
};
