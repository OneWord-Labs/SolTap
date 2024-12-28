
import { Logger } from '../../utils/Logger';

export class TelegramGameService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TelegramGameService');
    this.initTelegramProxy();
  }

  private initTelegramProxy() {
    (window as any).TelegramGameProxy = {
      initParams: {},
      receiveEvent: (event: string, payload?: any) => {
        this.logger.info('Telegram event received:', event, payload);
        switch(event) {
          case 'GAME_LOADED':
            this.logger.info('Game loaded in Telegram');
            break;
          case 'GAME_STARTED':
            this.logger.info('Game started in Telegram');
            break;
        }
      }
    };
  }

  public initGame() {
    if ((window as any).TelegramGameProxy) {
      (window as any).TelegramGameProxy.receiveEvent('GAME_LOADED');
    }
  }

  public sendScore(score: number) {
    if ((window as any).TelegramGameProxy) {
      (window as any).TelegramGameProxy.shareScore(score);
    }
  }
}
