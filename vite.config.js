import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    build: {
      sourcemap: mode === 'development' ? 'inline' : false,
      minify: false,
      // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
      lib: {
        entry: path.resolve(__dirname, './src/main.ts'),
        formats: ['cjs'],
      },
      rollupOptions: {
        output: {
          // Overwrite default Vite output fileName
          entryFileNames: 'main.js',
          assetFileNames: 'styles.css',
        },
        external: ['obsidian','antd/dist/antd.css'],
      },
      // Use root as the output dir
      emptyOutDir: false,
      outDir: '.',
    },
  };
});
