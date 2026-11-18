import { randomUUID } from 'node:crypto';
import { test } from '../../fixtures';
import chatReply from '../../fixtures/templates/chat-reply.json';
import { ChatUiPage } from '../../pages/chat-ui.page';

test.describe('Human Input chat UI', { tag: ['@feature:chat-ui', '@surface'] }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('send a chat message and get the reply of the flow', async ({ page, seed }) => {
    test.setTimeout(120000);
    const chatUiPage = new ChatUiPage(page);
    const message = `hello ${randomUUID().slice(0, 8)}`;
    const flow = await seed.flow({ template: chatReply, publish: true });

    await chatUiPage.visitChat(flow.flowId);
    await chatUiPage.sendMessage(message);
    await chatUiPage.expectBotReply(`You said: ${message}`);
  });
});
