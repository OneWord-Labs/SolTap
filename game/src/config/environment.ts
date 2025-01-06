interface Environment {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  telegram: {
    gameShortName: string;
    botToken: string;
    botUsername: string;
  };
  app: {
    baseUrl: string;
    port: number;
    host: string;
    corsOrigins: string[];
    logLevel: string;
  };
}

const environment: Environment = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  telegram: {
    gameShortName: process.env.GAME_SHORT_NAME || '',
    botToken: process.env.BOT_TOKEN || '',
    botUsername: process.env.BOT_USERNAME || ''
  },
  app: {
    baseUrl: process.env.BASE_URL || '',
    port: parseInt(process.env.PORT || '8090'),
    host: process.env.HOST || '0.0.0.0',
    corsOrigins: (process.env.CORS_ORIGINS || '').split(','),
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

export const validateEnvironment = (): void => {
  if (!environment.supabase.url) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  if (!environment.supabase.anonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }
  if (!environment.telegram.gameShortName) {
    throw new Error('Missing GAME_SHORT_NAME environment variable');
  }
  if (!environment.telegram.botToken) {
    throw new Error('Missing BOT_TOKEN environment variable');
  }
};

export default environment; 