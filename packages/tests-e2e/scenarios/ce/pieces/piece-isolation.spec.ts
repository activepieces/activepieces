import { randomInt } from 'node:crypto';
import { test } from '../../../fixtures';
import { e2eFlows } from '../../../fixtures/flows';
import { BuilderPage } from '../../../pages/builder.page';

/**
 * Warmup resilience smoke test.
 *
 * Triggers a piece sync (which may cause warmup for some pieces) and then
 * verifies the worker remains healthy by successfully running a Webhook flow.
 * A broken piece published with workspace:* dependencies must not prevent other
 * flows from executing.
 */
test.describe('Piece isolation — CE', () => {
  test('worker stays healthy after piece sync and can execute a webhook flow', async ({ page, request, session, cleanup }) => {
    test.setTimeout(120000);

    // Trigger a piece sync — this exercises the warmup path
    await request.post('/api/v1/pieces/sync', {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    const { webhookUrl } = await e2eFlows.publishWebhookEchoFlow({ page, cleanup });
    const value = randomInt(1, 1000000);
    await new BuilderPage(page).expectSyncWebhookResponse({
      url: `${webhookUrl}/sync?value=${value}`,
      expected: { value: String(value) },
    });
  });
});
