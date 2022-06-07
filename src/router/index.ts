import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import NotFound from '../pages/Error404.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/g/:uid',
    name: 'gallery',
    component: () => import('../components/GalleryLoader.vue'),
    props: (route) => ({ idGallery: route.params.uid }),
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
