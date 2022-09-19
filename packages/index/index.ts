import Graph from "../Graph";
import GraphMenu from "../menu/menu.vue";
import GraphNode from "../node/node.vue";
import GraphLine from "../link/link.vue";
import MarkLine from "../markLine/markLine.vue";
import { reactive, ref, nextTick } from 'vue'

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
    zoomMax: {
      type: Number,
      default: 5
    },
    zoomMin: {
      type: Number,
      default: 0.1
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
      drift: {  // 漂移值用于处理拖拽
        x: 3,
        y: 3
      },
      drag: {
        mouseDown: false,
        down: {},
        up: {}
      }, //  拖拽区域是否按下
      cZoom: 1,
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
      }),
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
      }
    },
  },
  mounted() {
    document.addEventListener("mouseup", this.docMouseup);
    document.addEventListener("mousemove", this.docMousemove);
    nextTick(() => {
      this.graph.initNode(this.nodeList);
      this.graph.initLink(this.linkList);
    });
  },
  beforeUnmount() {
    document.removeEventListener("mouseup", this.docMouseup);
    document.removeEventListener("mousemove", this.docMousemove);
  },
  methods: {
    /**
     * @method 实现画布拖拽效果,原理为仅在渲染时，通过计算函数实现元素偏移
     * @param event 
     */
    dargCanvas(event: MouseEvent) {
      if(event.target.id != 'superflow') return
      // drift
      switch (event.type) {
        case 'mousedown':
          console.log('鼠标按下')
          console.log('graph.nodeList:', this.graph.nodeList)
          this.drag.mouseDown = true
          this.drag.down = {
            dx: event.x,
            dy: event.y
          }

          break
        case 'mousemove':
          if (this.drag.mouseDown) {
            console.log('graph.nodeList:', this.graph.nodeList)
            let { x, y } = event
            console.log('按下并移动', x, y, this.drag.down)

            let { dx, dy } = this.drag.down
            // 计算差值(仅正值)
            let x_cha = x - dx
            let y_cha = y - dy

            // 进行减速
            x_cha = x_cha / 10
            y_cha = y_cha / 10

            // 计算偏差并减小抖动
            if (Math.abs(x_cha) > 3 || Math.abs(y_cha) > 3) {
              for (let node of this.graph.nodeList) {
                let [x, y] = node.position
                node.position = [this.floatAdd(x, x_cha), this.floatAdd(y, y_cha)]
              }
            }
          }
          break
        case 'mouseup':
          console.log('抬起')
          this.drag.mouseDown = false
          break
      }
    },

    /**
 * 解决两个数相乘精度丢失问题
 * @param a
 * @param b
 * @returns {Number}
 */
    floatMul(a: number, b: number) {
      var c = 0,
        d = a.toString(),
        e = b.toString();
      try {
        c += d.split(".")[1].length;
      } catch (f) { }
      try {
        c += e.split(".")[1].length;
      } catch (f) { }
      return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
    },
    floatAdd(a: number, b: number) {
      var c, d, e;
      if (undefined == a || null == a || isNaN(a)) { a = 0; }
      if (undefined == b || null == b || isNaN(b)) { b = 0; }
      try {
        c = a.toString().split(".")[1].length;
      } catch (f) {
        c = 0;
      }
      try {
        d = b.toString().split(".")[1].length;
      } catch (f) {
        d = 0;
      }
      e = Math.pow(10, Math.max(c, d));
      return (this.floatMul(a, e) + this.floatMul(b, e)) / e;
    },

    /**
     * @method 放大布局
     */
    zoomAdd() {
      if (this.cZoom < this.zoomMax) {
        this.cZoom = this.floatAdd(this.cZoom, 0.01)
      }
    },

    /**
     * @method 缩小布局
     */
    zoomSub() {
      if (this.cZoom > this.zoomMin) {
        // 不能直接相加,小数相加会有精度问题
        this.cZoom = this.floatAdd(this.cZoom, -0.01)
      }
    },

    /**
     * @method 缩小与放大
     */
    zoomEvent(e: WheelEvent) {
      e.preventDefault()
      if (Math.abs(e.deltaX) !== 0 && Math.abs(e.deltaY) !== 0) return console.log('没有固定方向');
      if (e.deltaX < 0) return console.log('向右');
      if (e.deltaX > 0) return console.log('向左');
      if (e.ctrlKey) {
        if (e.deltaY > 0) { // 双指向内-缩小
          this.zoomSub()
        }
        if (e.deltaY < 0) {  // 双指向外-放大
          this.zoomAdd()
        }
      } else {
        if (e.deltaY > 0) return console.log('向上');
        if (e.deltaY < 0) return console.log('向下');
      }
    },
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
      var { start, _end } = this.temEdgeConf.link
      console.log('绑定关系:', '起点', start, '终点', _end)
      start.childrens.push(_end)
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
      console.log('边缘按下', evt, node, startAt)
      if (this.linkAddable) {
        const link = this.graph.createLink({
          start: node,
          startAt,
        });
        link.movePosition = getOffset(evt, this.$el);
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
        nextTick(() => {
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
    nodeList: {
      handler() {
        this.graph.initNode(this.nodeList);
        // 增加节点时，重新渲染线，避免同时修改渲染link时缺少node节点，导致线不显示
        this.graph.initLink(this.linkList);
      },
      deep: true
    },
    linkList: {
      handler() {
        this.graph.initLink(this.linkList);
      },
      deep: true
    },
  },
  install(Vue) {
    Vue.component(this.name, this);
  },
};
