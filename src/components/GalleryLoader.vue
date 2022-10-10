<script setup lang="ts">
import store from '../store';
import GalleryCompiler from './GalleryCompiler.vue';

const props = defineProps<{ idGallery: string }>();
store.mutations.readFileData(props.idGallery);
</script>

<template>
  <gallery-compiler v-if="store.state.galleryIsReady" />
</template>
