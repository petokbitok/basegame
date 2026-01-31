import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'blockchain-vendor': ['wagmi', 'viem', '@coinbase/onchainkit', '@tanstack/react-query'],
          'ethers-vendor': ['ethers']
        }
      },
      onwarn(warning, warn) {
        if (warning.code === 'INVALID_ANNOTATION' && warning.message.includes('/*#__PURE__*/')) {
          return;
        }
        warn(warning);
      }
    },
    
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
  },
  
  server: {
    port: 3000,
  },
  
  preview: {
    port: 4173,
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
