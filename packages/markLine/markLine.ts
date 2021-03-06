  export default {
    props: {
      width: {
        type: Number,
        default: 0
      },
      height: {
        type: Number,
        default: 0
      },
      markLine: Array,
      markColor: String
    },
    mounted() {
      this.$refs.markLine.height = this.height
      this.$refs.markLine.width = this.width
      this.draw()
    },
    methods: {
      draw() {
        const ctx = this.$el.getContext('2d')
        ctx.clearRect(0, 0, this.width, this.height)
        ctx.strokeStyle = this.markColor
        ctx.lineWidth = 1
        ctx.setLineDash([4, 2])
        this.markLine.forEach(([start, end]) => {
          ctx.beginPath()
          ctx.moveTo(...start)
          ctx.lineTo(...end)
          ctx.stroke()
        })
      }
    },
    watch: {
      markLine() {
        this.draw()
      }
    }
  }
