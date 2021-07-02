
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

      subItem.selected(
        this.source,
        vector(this.position)
          .minus(this.graph.origin)
          .end
      )
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