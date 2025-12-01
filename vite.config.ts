import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Replace process.cwd() with '.' to avoid TypeScript error about 'cwd' missing on Process type
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the application code
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY)
      }
    }
  }
})