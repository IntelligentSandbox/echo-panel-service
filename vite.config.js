import { resolve } from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
                    src: resolve(
                        __dirname,
                        'node_modules/@ricky0123/vad-web/dist/*.onnx'
                    ),
                    dest: '',
                },
                {
                    src: resolve(
                        __dirname,
                        'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js'
                    ),
                    dest: '',
                },
                {
                    src: resolve(
                        __dirname,
                        'node_modules/onnxruntime-web/dist/*.wasm'
                    ),
                    dest: '',
                },
            ],
        }),
    ],
})
