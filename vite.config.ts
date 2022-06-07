import * as path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueI18n from '@intlify/vite-plugin-vue-i18n';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // treat all tags with a dash as custom elements
          isCustomElement: (tag) => tag.startsWith('ion-'),
        },
      },
    }),
    vueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: path.resolve(__dirname, './src/locales/**'),
    }),
  ],
});
