import { expect } from '@playwright/test';
import { BasePage } from './base';

export class ChatUiPage extends BasePage {
  url = '/chats';

  async visitChat(flowId: string) {
    await this.page.goto(`${this.url}/${flowId}`);
  }

  async sendMessage(message: string) {
    await this.page.getByTestId('chat-input').fill(message);
    await this.page.getByTestId('chat-send-button').click();
  }

  async expectBotReply(text: string) {
    await expect(this.page.getByTestId('chat-message-bot')).toHaveText(text, { timeout: 60000 });
  }
}
