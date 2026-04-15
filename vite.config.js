import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        checkin: resolve(__dirname, 'checkin.html'),
        award: resolve(__dirname, 'award.html'),
      },
    },
  },
});
