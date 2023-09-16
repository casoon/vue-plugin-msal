import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [vue(), dts()],
    build: {
        assetsDir: 'assets',
        lib: {
            entry: path.resolve(__dirname, 'src/index.lib.ts'),
            name: 'VuePluginMsal',
            fileName: (format) => `vue-plugin-msal.${format}.js`,
        },
        outDir: "dist",
        rollupOptions: {
            external: ['vue'],
            output: {
                dir: "dist",
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }

})