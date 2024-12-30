export class Logger {
  constructor(private prefix: string) {}

  log(...args: any[]) {
    console.log(`[${this.prefix}]`, ...args);
  }

  info(...args: any[]) {
    console.info(`[${this.prefix}]`, ...args);
  }

  error(...args: any[]) {
    console.error(`[${this.prefix}]`, ...args);
  }

  warn(...args: any[]) {
    console.warn(`[${this.prefix}]`, ...args);
  }
} 