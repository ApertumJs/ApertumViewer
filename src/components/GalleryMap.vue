<template>
    <div>
      <canvas v-show="roomVertex.length>1" v-if="canvasId" :id="canvasId" width="150" height="150">
        Your browser does not support the HTML5 canvas tag.</canvas>
    </div>
</template>

<script>
export default {
  props: {
    roomVertex: {
      type: Array,
      required: true,
    },
    activeWallIndex: {
      type: Number,
      required: true,
      default: null,
    },
    color: {
      type: String,
      required: false,
      default: 'black',
    },
  },
  data() {
    return {
      canvasId: null,
    };
  },
  watch: {
    roomVertex() {
      this.drawMap();
    },
    activeWallIndex() {
      this.drawMap();
    },

  },
  created() {
    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        // eslint-disable-next-line no-bitwise
        const r = Math.random() * 16 | 0; const
          v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    this.canvasId = uuidv4();
  },
  mounted() {
    this.drawMap();
  },
  destroyed() {

  },
  methods: {
    drawMap() {
      let minX = 0; let maxX = 0; let minY = 0; let
        maxY = 0;
      const canvas = document.getElementById(this.canvasId);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.roomVertex.forEach((point) => {
        const x = point[0];
        const y = point[1];
        minX = minX < x ? minX : x;
        maxX = maxX > x ? maxX : x;
        minY = minY < y ? minY : y;
        maxY = maxY > y ? maxY : y;
      });

      const scaleX = (canvas.width / (maxX - minX)) * 0.9;
      const scaleY = (canvas.height / (maxY - minY)) * 0.9;
      const scale = scaleX > scaleY ? scaleY : scaleX;
      // let borderX=
      const borderX = -minX * scale + (canvas.width - (maxX - minX) * scale) / 2;
      const borderY = -minY * scale + (canvas.height - (maxY - minY) * scale) / 2;

      // ctx.beginPath();
      let i = 0;
      let x0 = 0; let y0 = 0;
      this.roomVertex.forEach((point) => {
        ctx.beginPath();
        ctx.moveTo(x0 + borderX, y0 + borderY);
        const x = point[0] * scale + borderX;
        const y = point[1] * scale + borderY;
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        if (i - 1 === this.activeWallIndex) {
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#009688';
        }
        ctx.lineTo(x, y);
        ctx.stroke();
        i += 1;
        x0 = x - borderX;
        y0 = y - borderY;
      });
      ctx.beginPath();
      ctx.moveTo(x0 + borderX, y0 + borderY);
      if (this.roomVertex.length === this.activeWallIndex + 1) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#009688';
      } else {
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
      }
      ctx.lineTo(borderX, borderY);
      ctx.stroke();
    },
  },
};

</script>

<style scoped>

</style>
