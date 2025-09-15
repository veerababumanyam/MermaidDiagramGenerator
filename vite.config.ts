import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// Validate environment variables at build time
function validateBuildEnv(env: Record<string, string>) {
  const requiredVars = ['GEMINI_API_KEY'];

  for (const varName of requiredVars) {
    if (!env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      console.error('Please set this variable in your .env.local file');
      process.exit(1);
    }
  }

  // Validate API key format
  if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.startsWith('AIza')) {
    console.error('❌ GEMINI_API_KEY should start with "AIza"');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Validate environment in development/production builds
    if (mode !== 'test') {
      validateBuildEnv(env);
    }

    return {
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE || 'Mermaid Diagram Generator')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
    };
});
