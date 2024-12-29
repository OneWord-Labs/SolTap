export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(...args: any[]) {
    console.log(`[${this.context}]`, ...args);
  }

  error(...args: any[]) {
    console.error(`[${this.context}]`, ...args);
  }

  warn(...args: any[]) {
    console.warn(`[${this.context}]`, ...args);
  }

  debug(...args: any[]) {
    console.debug(`[${this.context}]`, ...args);
  }
} 