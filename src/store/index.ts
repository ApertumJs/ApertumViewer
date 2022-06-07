import { reactive, readonly } from 'vue';
import './interfaces.ts';
import config from '../config.json';

const state = reactive({
  metadata: <GalleryData> {},
  room: <Room> {},
  allContents: <ContentData[]> [],
  galleryIsReady: false,
  serverUrl: config.serverUrl,
});

function setContentsUrls(allContents:ContentData[]) {
  let allContentsLocal:ContentData[] = [];
  if (state.metadata.localStorage) {
    allContents.forEach((content) => {
      const contentLocal = content;
      if (contentLocal.file) {
        contentLocal.file.url = `/storage/${state.metadata.alias}/${contentLocal.file.name}`;
      }
      allContentsLocal.push(contentLocal);
    });
  } else {
    allContentsLocal = allContents;
  }

  return allContentsLocal;
}

const mutations = {
  async readFileData(idGallery:string) {
    try {
      const data = await fetch(`/storage/${idGallery}/data.json`);
      const dataObj = await data.json();
      state.metadata = dataObj.galleryData;
      state.room = dataObj.room;
      state.allContents = setContentsUrls(dataObj.allContents);
      state.galleryIsReady = true;
    } catch (error) {
      document.location.href = '/';
    }
  },
};

export default {
  state: readonly(state),
  mutations,
};
