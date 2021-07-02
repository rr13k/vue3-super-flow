  import {
    direction
  } from '../types'

  import {
    getOffset
  } from '../utils'

  export default {
    props: {
      graph: Object,
      node: Object,
      index: Number,
      isMove: Boolean,
      isTemEdge: Boolean,
      nodeIntercept: Function,
      lineDrop: Boolean,
      nodeDrop: Boolean
    },
    data() {
      return {
        direction,
        output: this.nodeIntercept()
      }
    },
    computed: {
      style() {
        const {
          position,
          width,
          height
        } = this.node

        return {
          width: width + 'px',
          height: height + 'px',
          top: position[1] + 'px',
          left: position[0] + 'px'
        }
      }
    },
    methods: {

      nodeMousedown(evt) {
        this.graph.toLastNode(this.index)
        this.$emit('node-mousedown', this.node, getOffset(evt))
      },

      nodeMouseenter(evt) {
        this.output = this.nodeIntercept()
        this.graph.mouseonNode = this.node
        if (!this.isTemEdge) return
        this.$emit('node-mouseenter', evt, this.node, getOffset(evt, this.$el))
      },

      nodeMouseleave() {
        this.graph.mouseonNode = null
        if (!this.isTemEdge) return
        this.$emit('node-mouseleave')
      },

      nodeMouseup() {
        if (!this.isTemEdge) return
        this.$emit('node-mouseup')
      },

      nodeContextmenu(evt) {
        this.$emit('node-contextmenu', evt, this.node)
      },

      sideMousedown(evt) {
        this.$emit('side-mousedown', evt, this.node, getOffset(evt, this.$el))
      }
    }
  }

