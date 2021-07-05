
import {vector} from '../utils'

export default {
  props: {
    graph: Object,
    visible: {
      type: Boolean,
      default: false
    },
    list: {
      type: Array,
      default: () => []
    },
    position: {
      type: Array,
      default: () => [0, 0]
    },
    source: {
      type: Object,
      default: () => ({})
    }
  },
  mounted() {
    console.log('menu', '内部执行',this.visible)
  },
  emits: ['update:visible'],
  computed: {
    style() {
      return {
        left: this.position[0] + 'px',
        top: this.position[1] + 'px'
      }
    }
  },
  methods: {
    select(subItem) {
      if (subItem.disable) return
      this.$emit('update:visible', false)
      console.log('选择触发')
      subItem.selected(
        this.source,
        vector(this.position)
          .minus(this.graph.origin)
          .end
      )
      this.$nextTick(()=>{
        console.log('查看变更', this.visible)
      })
    },
    close(evt) {
      this.$emit('update:visible', false)
    }
  },
  watch: {
    visible() {
      if (this.visible) {
        this.$nextTick(() => this.$el.focus())
      }
    }
  }
}