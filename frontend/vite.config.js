import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// .env 하나로 관리: 루트(../.env)의 VITE_* 변수만 프런트에 노출된다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '..',
  server: { port: 5173 },
})
