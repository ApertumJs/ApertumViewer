<script lang="ts" setup>
import { watch } from 'vue';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import store from '../store';
import WallContent from '../types/WallContent';
import Frame from '../types/Frame';


let player:Plyr;
const props = defineProps<{
  indexWall: number
  activeWall: number
  wallContent: WallContent
  pxPerMeter: number
}>();

watch(() => props.activeWall, (nextWall:number, prevWall:number) => {
  if (!player) return;
  if (nextWall === props.indexWall) player.play();
  if (prevWall === props.indexWall) player.stop();
});
const { frames } = store.state.room;
const { allContents } = store.state;
const emit = defineEmits<{(e: 'zoomImage', imageUrl: string): void}>();

const contentData = allContents.find((content) => content.id === props.wallContent.contentId);
const rootUrl = `/storage/${store.state.metadata.alias}/`;
let isFramed = false; let frameWidthPx = 0; let matWidthPx = 0;
let contentFrame:Frame = {
  frameWidth: 0,
  matWidth: 0,
  frameImageUrl: '',
  frameColor: '',
  matColor: '',
  isGlassed: false,
};
if (props.wallContent.frameIndex > -1 && frames) {
  isFramed = true;
  contentFrame = frames[props.wallContent.frameIndex];
  frameWidthPx = (contentFrame.frameWidth / 1000) * props.pxPerMeter;
  matWidthPx = (contentFrame.matWidth / 1000) * props.pxPerMeter;
}

const totalWidthPx = (props.wallContent.width / 100) * props.pxPerMeter + matWidthPx * 2;
const totalHeightPx = (props.wallContent.height / 100) * props.pxPerMeter + matWidthPx * 2;
const totalTopPx = (props.wallContent.top / 100) * props.pxPerMeter - frameWidthPx - matWidthPx;
const totalLeftPx = (props.wallContent.left / 100) * props.pxPerMeter - frameWidthPx - matWidthPx;

let contentShadowCSS = 'none';
if (props.wallContent.shadow !== undefined) {
  contentShadowCSS = `${(props.wallContent.shadow.hShadow / 100) * props.pxPerMeter}px
    ${(props.wallContent.shadow.vShadow / 100) * props.pxPerMeter}px
    ${(props.wallContent.shadow.blur / 100) * props.pxPerMeter}px
    ${(props.wallContent.shadow.spread / 100) * props.pxPerMeter}px
    ${props.wallContent.shadow.color}`;
}
if (props.wallContent.type === 'video') {
  setTimeout(() => {
    player = new Plyr(`#player-${props.wallContent.contentId}`, { controls: [] });
    player.loop = true;
    player.quality = 1080;
  }, 50);
}

function clickContent(e:MouseEvent) {
  if (!(e.metaKey || e.ctrlKey) || !contentData) return;
  if (props.wallContent.type === 'image') {
    if (contentData.file) emit('zoomImage', rootUrl + contentData.file.name);
  } else {
    player.togglePlay();
  }
}

let longPress:boolean;
function longPressContent() {
  if (!contentData) return;
  longPress = true;
  setTimeout(() => {
    if (props.wallContent.type === 'image') {
      if (longPress && contentData.file) emit('zoomImage', rootUrl + contentData.file.name);
    } else {
      player.togglePlay();
    }
  }, 500);
}
function longPressReset() {
  longPress = false;
}

</script>
<template>
  <div
    :id="wallContent.contentId"
    :class="{'framed':isFramed,
             'disabled-content': wallContent.disable,
             'video-content': wallContent.type === 'video',
             'wall-content':true}"
    :style="`top:${totalTopPx}px;
                left:${totalLeftPx}px;
                width:${totalWidthPx}px;
                height:${totalHeightPx}px;
                border-width:${frameWidthPx}px;
                border-color:${contentFrame.frameColor};
                border-image-source:${contentFrame.frameImageUrl};
                box-shadow:${contentShadowCSS}`"
    @click="clickContent($event)"
    @touchstart="longPressContent()"
    @touchend="longPressReset"
  >
    <div :class="contentFrame.isGlassed?'glass-frame':'no-glass'">
      <div
        class="mat-frame"
        :style="`box-shadow: inset 0 0 0 ${matWidthPx}px ${contentFrame.matColor};`"
      >
        <div
          v-if="wallContent.type === 'video'"
          :id="`player-${wallContent.contentId}`"
          :data-plyr-provider="contentData?.video?.source"
          :data-plyr-embed-id="contentData?.video?.id"
        />
        <img
          v-else
          :alt="contentData?.name"
          class="image-content"
          :src="contentData?.file?.url"
          :style="`top:${matWidthPx}px;
                    left:${matWidthPx}px;
                    width:${(wallContent.width / 100) * props.pxPerMeter}px;
                    height:${(wallContent.height / 100) * props.pxPerMeter}px;`"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>

.wall-content{
  position: absolute;
  opacity: 1;
  overflow: visible;
  cursor:zoom-in;
  font-size: 1rem;
}
.disable{
  cursor:inherit !important;
}
.image-content{
  position:relative;
  z-index: -1;
}
.framed{
  z-index: +1;
  border-image-slice: 100;
  border-style:solid;
}
.framed .image-content{
  border: 2px solid #91918a;
  border-right-color: #eed;
  border-bottom-color: #d7d7c8;
  border-left-color: #6e6868;
}
.mat-frame{
  position: relative;
  z-index: -1;
  width: 100%;
  height: 100%;
  box-shadow: inset 0 0 0 40px white;
}
.glass-frame{
  z-index: +1;
  width: 100%;
  height: 100%;
  background: transparent;
  box-shadow: inset 3px -2px 17px 2px rgba(0, 0, 0, 0.25),
    inset -5px -14px 20px 0 rgba(200, 199, 199, 0.15);
}
.no-glass{
  z-index: +1;
  width: 100%;
  height: 100%;
  background: transparent;
}
.video-content{
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor:inherit !important;
}
</style>
