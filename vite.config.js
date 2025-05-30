// vite.config.js

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import eslintPlugin from 'vite-plugin-eslint';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      eslintPlugin({
        include: ['src/**/*.js', 'src/**/*.jsx'],
      }),
    ],
    resolve: {
      alias: {
        src: resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 8000,
      strictPort: true,
      cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
        credentials: true
      },
      proxy: {
        '/googleapis': {
          target: 'https://accounts.google.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/googleapis/, '')
        }
      }
    },
    build: {
      minify: false, 
      sourcemap: true, 
      chunkSizeWarningLimit: 5000, 
    },
    define: {
      'process.env': env,
    },
  };
});
