<script lang="ts" setup>
import {
  ref, reactive, watch, computed,
} from 'vue';
import ImageViewer from 'iv-viewer';
import 'iv-viewer/dist/iv-viewer.css';
import pointInPolygon from 'robust-point-in-polygon';
import { useI18n } from 'vue-i18n';
import store from '../store';
import wallContent from './WallContent.vue';
import galleryMap from './GalleryMap.vue';

const { t } = useI18n();

const isMobile = (navigator.maxTouchPoints > 0);
// const isIframe = (window.location !== window.parent.location);

const {
  metadata, allContents, room, serverUrl,
} = store.state;
const { resolutionQuality } = room.options;
const { initialZoom } = room.options;
let initialTouchDist:number;
const showGalleryInfo = ref<boolean>(true);
const showSharePanel = ref<boolean>(false);
const showHelpPanel = ref<boolean>(false);
const showImageZoom = ref<boolean>(false);
const fullScreenIsActive = ref<boolean>(false);
const activeContentId = ref<string|null>(null);
const activeContent = reactive({
  name: '',
  info: '',
  dimensions: '',
});
const activeWall = ref<number>(0);
const avatarUrl = allContents[0].file?.url;
const dateCreatedGallery = metadata.dateCreated.split(' ')[0];
let imgZoom:ImageViewer;
let panState = false;
let cursorPosition = [0, 0];
let roomVertex:Point[];
let wallProperties:{
  widthPx:number,
  heightPx:number,
  positionX:number,
  positionZ:number,
  angleDeg:number,
  color:string | null,
  backgroundImage?:string | null,
}[];
const mutedAudio = ref<boolean>(false);
let wallAudio:HTMLAudioElement;
let roomAudio:HTMLAudioElement;

const pxPerMeter = computed(
  () => (window.innerHeight / (room.walls[0].height / 100)) * resolutionQuality,
);
const perspective = computed(
  () => (window.innerWidth / window.innerHeight) * pxPerMeter.value * resolutionQuality,
);
const viewerTop = computed(
  () => (window.innerHeight - (room.walls[0].height / 100) * pxPerMeter.value) / 2,
);
const iframeText = computed(
  () => `<iframe width='100%' height='100vh' frameborder='0' src='${serverUrl}/g/${metadata.alias}' allowfullscreen webkitallowfullscreen mozallowfullscreen />`,
);
const viewerNav:Navigation = reactive({
  positionX: -window.innerWidth / 2,
  positionZ: perspective.value,
  angleDeg: 0,
  transitionDuration: 1.5,
});
const viewerLeft = computed(
  () => viewerNav.positionX - window.innerWidth / 2,
);

watch(() => activeContentId.value, (contentId) => {
  if (!contentId) return;
  const contentData = allContents.find((content) => content.id === contentId);
  if (!contentData) return;
  activeContent.name = contentData.name;
  if (contentData.info) activeContent.info = contentData.info;
  if (contentData.realDimensions?.show) {
    activeContent.dimensions = `${contentData.realDimensions.height} x ${contentData.realDimensions.width} cm -
    ${Math.round(contentData.realDimensions.height * 3.9) / 10} x ${Math.round(contentData.realDimensions.width * 3.9) / 10} in `;
  }
});

function getwallProperties() {
  let positionX = 0;
  let positionZ = 0;
  let wallAngleRad; let angleDeg; let widthPx; let heightPx; let backgroundImage;
  wallProperties = [];
  roomVertex = [];
  room.walls.forEach((wall) => {
    widthPx = wall.width * (pxPerMeter.value / 100);
    heightPx = wall.height * (pxPerMeter.value / 100);
    wallAngleRad = wall.angle;
    angleDeg = wall.angle * (180 / Math.PI);
    backgroundImage = null;
    if (!room.hasWallsPreview && wall.backgroundImage) {
      backgroundImage = allContents.find(
        (content) => content.id === wall.backgroundImage,
      )?.file?.url;
    }
    wallProperties.push({
      widthPx,
      heightPx,
      positionX,
      positionZ,
      angleDeg,
      color: wall.color,
      backgroundImage,
    });
    roomVertex.push([positionX, positionZ]);
    positionX += widthPx * Math.cos(wallAngleRad);
    positionZ -= widthPx * Math.sin(wallAngleRad);
  });
}
function coordinatesRotation(x:number, z:number, angleDeg:number = -viewerNav.angleDeg) {
  const angleRad = angleDeg * (Math.PI / 180);
  const X = x * Math.cos(angleRad) + z * Math.sin(angleRad);
  const Z = -x * Math.sin(angleRad) + z * Math.cos(angleRad);
  return [X, Z];
}
function moveViewer(deltaX:number, deltaZ:number) {
  const navigationDeltaInGlobalCoordinates = coordinatesRotation(deltaX, deltaZ);
  const newPositionX = viewerNav.positionX + navigationDeltaInGlobalCoordinates[0];
  const newPositionZ = viewerNav.positionZ + navigationDeltaInGlobalCoordinates[1];

  if ((pointInPolygon(roomVertex, [newPositionX, newPositionZ]) < 0)) {
    viewerNav.positionX = newPositionX;
    viewerNav.positionZ = newPositionZ;
  }
}
function rotateViewer(angleDeg:number) {
  let angleRotationDeg = angleDeg;
  if (Math.abs(angleRotationDeg) > 360) {
    angleRotationDeg = (Math.abs(angleRotationDeg) - 360) * Math.sign(angleRotationDeg);
  }
  viewerNav.angleDeg = angleRotationDeg;
}
function calculateInterval(viewerNewPosition:number[]) {
  const pxPerSecond = pxPerMeter.value * 3;
  const deltaX = viewerNewPosition[0] - viewerNav.positionX;
  const deltaZ = viewerNewPosition[1] - viewerNav.positionZ;
  const module = Math.sqrt(deltaX ** 2 + deltaZ ** 2);
  return module / pxPerSecond;
}

function playRoomAudio() {
  if (!room.generalAudio) return;
  let audioUrl:string|null = null;
  // let audioLoop = false;
  const audioContent = allContents.find((content) => content.id === room.generalAudio);
  if (audioContent && audioContent.file) {
    audioUrl = audioContent.file.url;
  // audioLoop = audioContent.loop;
  }
  if (!mutedAudio.value && audioUrl) {
    roomAudio = new Audio(audioUrl);
    roomAudio.autoplay = true;
  }
}

function playWallAudio(indexWall:number = activeWall.value) {
  if (wallAudio) {
    wallAudio.pause();
  }
  let audioUrl:string|null = null;
  // let audioLoop = false;
  const audioContent = allContents.find((content) => content.id === room.walls[indexWall].audio);
  if (audioContent && audioContent.file) {
    audioUrl = audioContent.file.url;
  // audioLoop = audioContent.loop;
  }
  if (!mutedAudio.value && audioUrl) {
    wallAudio = new Audio(audioUrl);
    wallAudio.load();
    wallAudio.autoplay = true;
  }
}

function moveToWall(indexWall:number, deltaIndex:number = 0) {
  const d = 2 * (resolutionQuality / initialZoom); // min dance from wall corner in metres
  let fistPositionDistance:number;
  const viewerNewPosition:number[] = [];
  let viewerNewAngleDeg:number = 0;
  let interval:number;
  let nextWallIndex:number = indexWall + deltaIndex;
  if (nextWallIndex < 0) nextWallIndex = wallProperties.length - 1;
  if (nextWallIndex > wallProperties.length - 1) nextWallIndex = 0;
  activeWall.value = nextWallIndex;
  const { angleDeg } = wallProperties[nextWallIndex];
  if (angleDeg === 0 || angleDeg === 180) {
    viewerNewAngleDeg = angleDeg;
  } else {
    viewerNewAngleDeg = angleDeg - 180;
  }
  const deltaAngle = viewerNewAngleDeg - viewerNav.angleDeg;
  if (deltaIndex >= 0) {
    fistPositionDistance = pxPerMeter.value * d * 0.5;
  } else {
    fistPositionDistance = wallProperties[nextWallIndex].widthPx - pxPerMeter.value * d * 0.5;
  }
  const firstPositions = coordinatesRotation(fistPositionDistance, pxPerMeter.value * d, angleDeg);
  viewerNewPosition[0] = wallProperties[nextWallIndex].positionX + firstPositions[0];
  viewerNewPosition[1] = wallProperties[nextWallIndex].positionZ + firstPositions[1];
  interval = calculateInterval(viewerNewPosition);
  if (deltaIndex === 0) interval = 0;
  viewerNav.transitionDuration = interval;
  [viewerNav.positionX, viewerNav.positionZ] = viewerNewPosition;
  if (Math.abs(deltaAngle) > 180) {
    const hiddenRotation = viewerNewAngleDeg + 90 * (deltaAngle / Math.abs(deltaAngle));
    viewerNav.transitionDuration = 0;
    rotateViewer(hiddenRotation);
  }
  setTimeout(() => {
    viewerNav.transitionDuration = 1.5;
    rotateViewer(viewerNewAngleDeg);
    setTimeout(() => { viewerNav.transitionDuration = 0; }, 50);
  }, 50);
  if (!showGalleryInfo.value) playWallAudio();
}

function sceneMouseDown(e:MouseEvent) {
  if (showImageZoom.value || showGalleryInfo.value) return;
  cursorPosition = [e.clientX, e.clientY];
  panState = true;
  const scene = document.getElementById('scene');
  if (scene) scene.style.cursor = 'grabbing';
}

function sceneMouseMove(e:MouseEvent) {
  if (panState) {
    const deltaX = e.clientX - cursorPosition[0];
    moveViewer(-deltaX, 0);
    cursorPosition = [e.clientX, e.clientY];
  }
}

function sceneMouseUp() {
  panState = false;
  const scene = document.getElementById('scene');
  if (scene) scene.style.cursor = 'default';
}

function sceneMouseWheel(e:WheelEvent) {
  if (showImageZoom.value || showGalleryInfo.value) return;
  const wheelDelta = -e.deltaY;
  moveViewer(0, wheelDelta);
}

function sceneTouchStart(e:TouchEvent) {
  if (showImageZoom.value || showGalleryInfo.value) return;
  if (e.touches.length === 2) {
    initialTouchDist = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY,
    );
  }
  cursorPosition = [e.touches[0].clientX, e.touches[0].clientY];
}

function sceneTouchZoom(e:TouchEvent) {
  if (showImageZoom.value || showGalleryInfo.value) return;
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY,
    );
    const deltaZ = dist - initialTouchDist;
    moveViewer(0, -deltaZ * 0.5);
  } else {
    const deltaX = e.changedTouches[0].clientX - cursorPosition[0];
    moveViewer(-deltaX, 0);
  }
}

function keyControl(event:KeyboardEvent) {
  if (event.key === 'ArrowRight') rotateViewer(viewerNav.angleDeg + 5);
  if (event.key === 'ArrowUp') moveViewer(0, pxPerMeter.value / 100);
  if (event.key === 'ArrowLeft') rotateViewer(viewerNav.angleDeg - 5);
  if (event.key === 'ArrowDown') moveViewer(0, -pxPerMeter.value / 100);
  if (event.key === 'Escape') { showImageZoom.value = false; showSharePanel.value = false; showHelpPanel.value = false; }
  if (event.key === ' ') moveToWall(activeWall.value, +1);
}

function setActiveContentId(contentId:string|null) {
  activeContentId.value = contentId;
  setTimeout(() => {
    activeContentId.value = null;
  }, 1500);
}

function zoomImage(imgSrc:string) {
  showImageZoom.value = true;
  if (!imgZoom) imgZoom = new ImageViewer(document.querySelector('#zoom-img'));
  setTimeout(() => {
    imgZoom.load(imgSrc);
    imgZoom.refresh();
  }, 500);
}

function setOpacity(e:TouchEvent, opacity:string) {
  const element = e.target as HTMLDivElement;
  element.style.opacity = opacity;
}

function volumenMute() {
  mutedAudio.value = !mutedAudio.value;
  roomAudio.muted = mutedAudio.value;
  wallAudio.muted = mutedAudio.value;
}

function openFullScreen() {
  document.documentElement.requestFullscreen();
  fullScreenIsActive.value = true;
}

function closeFullScreen() {
  document.exitFullscreen();
  fullScreenIsActive.value = false;
}

function openGallery() {
  playRoomAudio();
  showGalleryInfo.value = false;
}

getwallProperties();
moveToWall(0);

window.addEventListener('keydown', keyControl);
window.addEventListener('resize', getwallProperties);

</script>
<template>
<div>
   <div id="scene" :style="`perspective:${perspective}px;background-color:${room.colors.ceiling}`"
    @mousedown.prevent="sceneMouseDown($event)"
    @mousemove.prevent="sceneMouseMove($event)"
    @mouseup.prevent="sceneMouseUp()"
    @wheel.prevent="sceneMouseWheel($event)"
    @touchstart.prevent="sceneTouchStart($event)"
    @touchmove.prevent="sceneTouchZoom($event)">
    <div id="floor" :style="`background-color:${room.colors.floor}`"></div>
    <div id="viewer"
      :style="`top:${viewerTop}px;
        transition-duration:${viewerNav.transitionDuration}s;
        transform:translate3d(${-viewerLeft}px, 0, ${-viewerNav.positionZ+perspective}px)`">
        <div id="room"
          :style="`transform-origin: ${viewerNav.positionX}px 0 ${viewerNav.positionZ}px;
                  transform:rotateY(${viewerNav.angleDeg}deg);
                  transition-duration:${viewerNav.transitionDuration}s`">
          <div id="viewerRef"
            :style="`transform:translate3d(${viewerNav.positionX}px,0,${viewerNav.positionZ}px)`"/>
          <figure v-for="(wall, indexWall) in wallProperties" :key="'wall-'+ indexWall"
            :id="'wall-'+indexWall"
            class="wall"
            :style="`width:${wall.widthPx}px; height:${wall.heightPx}px;
                    transform-origin: ${wall.positionX}px 0 ${wall.positionZ}px;
                    transform:rotateY(${wall.angleDeg}deg)
                    translate3d(${wall.positionX}px, 0, ${wall.positionZ}px);
                    background-color:${wall.color}`">
            <div class='absolute-left move-wall-area'
              @touchstart="setOpacity($event,'1')" @touchend="setOpacity($event,'0')">
              <div class="absolute-left move-wall"
                @click="moveToWall(indexWall,-1)"
                @touchstart="moveToWall(indexWall,-1)">
                  <ion-icon name="arrow-undo-outline" size="large"/>
              </div>
            </div>
            <div class='absolute-right move-wall-area'
              @touchstart="setOpacity($event,'1')" @touchend="setOpacity($event,'0')">
              <div class="absolute-right move-wall"
                @click="moveToWall(indexWall,1)"
                @touchstart="moveToWall(indexWall,1)">
                  <ion-icon name="arrow-redo-outline" size="large"/>
              </div>
            </div>
            <div v-if="wall.backgroundImage" class="wall-background"
              :style="`background-image:url('${wall.backgroundImage}')`"></div>
            <wall-content  v-for="(wallContent,key) in room.walls[indexWall].contents" :key="key"
              :pxPerMeter="pxPerMeter" :wallContent="wallContent"
              :index-wall="indexWall" :active-wall="activeWall"
              @zoomImage="zoomImage"
              @mouseenter="activeContentId=wallContent.contentId"
              @mouseleave="activeContentId=null"
              @touchstart="setActiveContentId(wallContent.contentId)"/>
          </figure>
      </div>
    </div>
  </div>
  <!-- Info panels -->
   <div id="wall-info" class="z-top" v-show="!activeContentId">
      <div >
       <gallery-map :roomVertex="roomVertex" :activeWallIndex="activeWall"></gallery-map>
       <strong>{{t('wall')}}: {{activeWall + 1}} / {{room.walls.length}}</strong>
      </div>
  </div>
  <div id="content-info" class="z-top" v-show="activeContentId"
      @touchstart="activeContentId=null">
      <div class="content-info-header">
        {{activeContent.name}}
      </div>
      <div class="content-info-body">
        <span v-html="activeContent.info"></span>
        {{activeContent.dimensions}}
      </div>
  </div>
  <!-- Tools panel -->
  <div id="tools-panel" class="">
        <ion-icon name="document-outline"
        @click="showGalleryInfo=true" @touchstart="showGalleryInfo=true"></ion-icon>
        <ion-icon v-if="mutedAudio" name="volume-mute-outline"
        @click="volumenMute" @touchstart="volumenMute"></ion-icon>
       <ion-icon v-else name="volume-high-outline"
        @click="volumenMute" @touchstart="volumenMute"></ion-icon>
        <ion-icon name="share-social-outline"
        @click="showSharePanel=true" @touchstart="showSharePanel=true"></ion-icon>
        <ion-icon v-if="!fullScreenIsActive" name="expand-outline"
        @click="openFullScreen" @touchstart="openFullScreen"></ion-icon>
        <ion-icon v-else name="contract-outline"
        @click="closeFullScreen" @touchstart="closeFullScreen"></ion-icon>
        <ion-icon name="information-circle-outline"
        @click="showHelpPanel=true" @touchstart="showHelpPanel=true"></ion-icon>
  </div>
  <!-- Overlays -->
  <div id="overlay-zoom" class="overlay z-top"  v-show="showImageZoom">
    <div  class="z-top close-icon"
      @click="showImageZoom=!showImageZoom" @touchstart="showImageZoom=!showImageZoom">
      <ion-icon name="close-outline" ></ion-icon>
    </div>
    <div id="zoom-img"></div>
  </div>
  <div id="overlay-gallery-info" class="overlay z-top"  v-show="showGalleryInfo">
    <div id="container-gallery-info">
      <div id="avatar" class="gallery-info-box">
        <img :src="avatarUrl">
      </div>
      <div class="gallery-info-box">
        <div id="gallery-info-header">
            <span id="gallery-date">{{dateCreatedGallery}}</span>
          <span id="gallery-name">{{metadata.name}}</span>
          <div id="gallery-enter-bottom"
            @click="openGallery()"
            @touchstart="openGallery()">
            <span>{{t('gallery-enter')}}</span>
            <ion-icon name="enter-outline" size="large"></ion-icon>
          </div>
        </div>
        <div class="gallery-tag" v-for="(tag,key) in metadata.galleryTags" :key="key">
          {{tag}}
        </div>
        <div id="gallery-synopsis">
          {{metadata.synopsis}}</div>
        <div id="gallery-description">
          <span v-html="metadata.description"></span></div>
      </div>
    </div>
  </div>
  <div id="overlay-share-panel" class="overlay z-top" v-show="showSharePanel">
    <div  class="z-top close-icon"
        @click="showSharePanel=!showSharePanel" @touchstart="showSharePanel=!showSharePanel">
        <ion-icon name="close-outline" ></ion-icon>
    </div>
    <div id="share-panel" class="text-white">
      <h1>{{t('share-gallery')}}</h1>
      <h4>{{t('gallery-link')}}:</h4>
      <div class="input-box">{{serverUrl}}/g/{{metadata.alias}}</div>
      <h4 class="text-white"> {{t('embed-iframe')}}:</h4>
      <div class="input-box"> {{iframeText}}</div>
      <h4> {{t('social')}}:</h4>
      <div class="social-icons" >
        <a target="_blank" :href="'https://www.facebook.com/sharer/sharer.php?u=' + encodeURI(serverUrl+'/g/'+ metadata.alias)">
          <ion-icon name="logo-facebook"></ion-icon>
        </a>
        <a target="_blank" :href="'https://twitter.com/intent/tweet?tw_p=tweetbutton&url='+ encodeURI(serverUrl+'/g/'+ metadata.alias) + '&text=' + encodeURI(metadata.name)">
            <ion-icon name="logo-twitter"></ion-icon>
        </a>
        <a target="_blank" :href="'http://pinterest.com/pin/create/button/?url=' + encodeURI(serverUrl+'/g/'+ metadata.alias) + '&media=' + avatarUrl+ '&description=' + encodeURI(metadata.name)">
            <ion-icon name="logo-pinterest"></ion-icon>
        </a>
      </div>
    </div>
  </div>
  <div id="overlay-help" class="overlay z-top" v-show="showHelpPanel">
    <div  class="z-top close-icon"
        @click="showHelpPanel=!showHelpPanel" @touchstart="showHelpPanel=!showHelpPanel">
        <ion-icon name="close-outline" ></ion-icon>
    </div>
    <div id="help-panel" class="text-white">
      <h1>{{t('navigation')}}</h1>
      <div v-if="!isMobile">
        <h3 v-html="t('navigation-desktop-line1')"></h3>
        <h3 v-html="t('navigation-desktop-line2')"></h3>
        <h3 v-html="t('navigation-desktop-line3')"></h3>
        <h3 v-html="t('navigation-desktop-line4')"></h3>
        <h3 v-html="t('navigation-desktop-line5')"></h3>
        <h3 v-html="t('navigation-desktop-line6')"></h3>
      </div>
      <div v-else>
        <h3 v-html="t('navigation-mobile-line1')"></h3>
        <h3 v-html="t('navigation-mobile-line2')"></h3>
        <h3 v-html="t('navigation-mobile-line3')"></h3>
        <h3 v-html="t('navigation-mobile-line4')"></h3>
        <h3 v-html="t('navigation-mobile-line5')"></h3>
        <h3 v-html="t('navigation-mobile-line6')"></h3>
      </div>
    </div>
  </div>
</div>

</template>

<style scoped>

#scene, #app {
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

#floor {
  position: absolute;
  z-index: -10;
  top: 50%;
  left: 0;
  width: 100%;
  height: 50%;
}
#viewer{
  position: absolute;
  transform-style: preserve-3d;
  transition-timing-function: default;
}

#viewerRef{
  z-index: 10;
  position: absolute;
  display: none;
}
#room{
  position: absolute;
  transform-style: preserve-3d;
  transition-timing-function: default;
}
.wall{
  position: absolute;
  z-index: -5;
  display: block;
  opacity: 1;
  margin: 0;
  background-size: 100% 100%;
  transform-origin: 0 0;
  backface-visibility: hidden;
  background: linear-gradient(to bottom, rgba(160, 160, 160, 0.05) 0%, rgba(40, 40, 40, 0.1) 100%);
  box-shadow: inset 0 0 1px 2px rgba(36, 36, 36, 0.1);
}
.move-wall-area{
    height:100%;
    width:10%;
    max-width: 300px;
    background: transparent;
    opacity: 0;
    z-index: +10;
}
.move-wall{
    position: fixed;
    top: 40%;
    height: 20%;
    width: 100px;
    z-index: 50;
    color: white;
    background: rgba(0, 0, 0, 0.54);
    box-shadow: 1px 2px 5px 1px rgba(50, 48, 48, 0.7);
    cursor: pointer;
    font-size: 2em;
    border-radius: 1em;
    display: grid;
    place-items: center;
}
.move-wall-area:hover, .move-wall-area:active{
    opacity: 1 !important;
}
.wall-background{
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    background-origin: border-box;
    background-size: cover;
    z-index: -1;
}

#content-info, #wall-info{
  position:absolute;
  bottom:2em;
  left: 1.5em;
  max-width: 300px;
  min-width: 150px;
  max-height: 350px;
  color: black;
  background: white;
  overflow: hidden;
  padding: 1.5em;
  border-radius: 1em
}

#wall-info{
  text-align: center;
}
.content-info-header{
  font-weight: bold;
  font-size: larger;
}
#zoom-img{
  position: relative;
  top: 2%;
  width: auto;
  height: 95%;
}

#overlay-share-panel, #overlay-help{
  display: grid;
 place-items: center;
}
#share-panel, #help-panel {
  width: 60%;
  min-width: 400px
}
.social-icons a {
  font-size: 2em;
  margin-right: 0.5em;
}
ion-icon {
  color: rgb(255, 255, 255);
}
#overlay-gallery-info {
  display: grid;
  place-items: center;
}
#tools-panel{
  position:absolute;
  bottom:2.5em;
  right: 1em;
  color: black;
  background: white;
  overflow: hidden;
  padding: 1em;
  border-radius: 1em;
  display: inline-flex;
  place-content: space-evenly;
}
#tools-panel ion-icon{
  color:black;
  font-size:2em;
  padding: 0 0.3em;
  cursor: pointer;
}
#gallery-date{
  font-size:small;
  display: block;
  background-color: white;
  color:#CC0066;
  padding: 0.5em;
  width: 5em;
  text-align: center;

}
#gallery-name{
  display: block;
  margin-bottom: 1.5em;
  padding: 0.5em;
  font-size: 2em;
}
#gallery-enter-bottom{
  margin-top: 1.5em;
  cursor: pointer;
  display: flex;
  align-items: center;
  place-content: flex-end;
}
#avatar img{
 float: right;
 border-radius:1em;
}
#gallery-info-header{
  color:white;
  background: rgb(63,94,251);
  background: linear-gradient(90deg, rgba(63,94,251,1) 0%, rgba(204,0,102,1) 100%);
  padding: 2em;
  font-size:x-large;
  margin: 0em 0 1em 0;
  text-align: left;
  border-radius:1em;
}
#gallery-synopsis{
  margin-top: 2em;
  font-size:large;
  font-weight: bold;
  padding: 1.5em ;
  border: solid;
  border-bottom: none;
  background-color: white;
  border-radius:1em 1em 0 0;
  max-height: 5em;
  overflow-y: scroll;
  overflow-x: hidden;
}
#gallery-description{
  padding: 1.5em ;
  padding-top: 0;
  border: solid;
  border-top: none;
  background-color: white;
  border-radius: 0 0 1em 1em;
  max-height: 15em;
  overflow-y: scroll;
  overflow-x: hidden;
}
.gallery-tag{
  height: 1em;
  color: white;
  background: rgba(204,0,102,1);
  background: linear-gradient(90deg, rgba(63,94,251,1) 0%, rgba(204,0,102,1) 100%);
  border-radius: 0.5em;
  margin: 0.5em;
  padding: 0.5em;
  font-size: smaller;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
}
#container-gallery-info{
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(auto, 760px);
  text-align: justify;
}
.gallery-info-box {
    height: 100%;
    padding: 0px 1.5em ;
  }
.close-icon{
  font-size: 3em;
  padding: 0.5em;
  --ionicon-stroke-width: 1.5em;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.54);
  border-radius: 0.5em;
  display: grid;
  place-items: center;
  position: absolute;
  top: 0.5em;
  right: 0.5em;
}
</style>
