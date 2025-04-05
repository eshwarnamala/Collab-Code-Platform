// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, 
    proxy: {
      // Proxy API requests to the backend (running on port 5000)
      '/api': {
        target: 'http://backend:5000',
        // target: 'https://collab-code-platform-server.onrender.com',
        
        changeOrigin: true,
        secure: false,
      },
      '/auth': { // Proxy OAuth routes
        // target: 'https://collab-code-platform-server.onrender.com',
        target: 'http://backend:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
