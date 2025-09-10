import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url';
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    open: false,
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {

        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: {},
    }),
  ],
})
