
export const URLS = {
  development: process.env.REPLIT_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
  production: process.env.REPLIT_DEPLOYMENT_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
};

export const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' ? URLS.production : URLS.development;
};
