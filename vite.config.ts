import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { patchNotesApiPlugin } from './server/patchNotesApi.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), patchNotesApiPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
