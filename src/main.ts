import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import router from './router';

import './styles/main.css';

import en from './locales/en.json';
import es from './locales/es.json';

let userLocale = navigator.languages && navigator.languages.length
  ? navigator.languages[0] : navigator.language;

if (userLocale !== 'es') userLocale = 'en';

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  messages: {
    en,
    es,
  },
});

createApp(App)
  .use(i18n)
  .use(router)
  .mount('#app');
