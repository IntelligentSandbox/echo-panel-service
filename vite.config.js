import { resolve } from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const p = (...args) => resolve(__dirname, ...args).replaceAll('\\', '/')

// silero model + worklet and the onnxruntime wasm must sit at the served root
// so MicVAD can fetch them via baseAssetPath/onnxWASMBasePath
export default defineConfig({
    root: 'src',
    server: {
        host: true,
        port: 47105,
    },
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: p('node_modules/@ricky0123/vad-web/dist/*.onnx'),
                    dest: '',
                },
                {
                    src: p('node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js'),
                    dest: '',
                },
                {
                    src: p('node_modules/onnxruntime-web/dist/*.wasm'),
                    dest: '',
                },
            ],
        }),
    ],
})
