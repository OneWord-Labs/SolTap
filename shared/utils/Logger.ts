import debug from 'debug';

export class Logger {
  private context: string;
  private debugger: debug.Debugger;

  constructor(context: string) {
    this.context = context;
    this.debugger = debug(`app:${context.toLowerCase()}`);
  }

  info(message: string, ...args: any[]): void {
    this.debugger(`[INFO] ${message}`, ...args);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${this.context}] ${message}`, ...args);
    }
  }

  error(message: string, error?: any): void {
    this.debugger(`[ERROR] ${message}`, error);
    console.error(`[${this.context}] ${message}`, error);
  }

  warn(message: string, ...args: any[]): void {
    this.debugger(`[WARN] ${message}`, ...args);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${this.context}] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.debugger(`[DEBUG] ${message}`, ...args);
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${this.context}] ${message}`, ...args);
    }
  }
}
