import path from 'path';
import {defineConfig} from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import react from '@vitejs/plugin-react'

export default defineConfig(({mode}) => {
	return {
		plugins: [react(),cssInjectedByJsPlugin()],
		build: {
			sourcemap: mode === 'development' ? 'inline' : false,
			minify: false,
			// Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
			lib: {
				entry: path.resolve(__dirname, './src/main.tsx'),
				formats: ['cjs'],
			},
			rollupOptions: {
				output: {
					// Overwrite default Vite output fileName
					entryFileNames: 'main.js',
					assetFileNames: 'styles.css',
				},
				external: ['obsidian'],
			},
			// Use root as the output dir
			emptyOutDir: false,
			outDir: '.',
		},
	};
});
