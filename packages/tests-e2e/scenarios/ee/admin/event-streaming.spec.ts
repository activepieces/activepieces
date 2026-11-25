import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/audit-logs';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';
import { EventStreamingPage } from '../../../pages/event-streaming.page';

test.describe('Event streaming', { tag: ['@feature:audit', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('stream events to a webhook flow of the spec and receive one', async ({ page, session, seed, cleanup, auditLog }) => {
    const sink = await seed.flow({ template: webhookEcho, publish: true });
    const [folderId] = await auditLog.createFolders({ names: [e2eApi.uniqueName('stream folder')], session });
    const streamedName = e2eApi.uniqueName('streamed folder');
    const streamingPage = new EventStreamingPage(page);

    await streamingPage.expectLiveDestinations();
    await streamingPage.startWebhookDestination({ event: 'Folder updated' });
    await streamingPage.urlField().fill(sink.webhookUrl);
    const destinationId = await streamingPage.createDestination();
    cleanup.track({ resource: 'event-destinations', id: destinationId });
    await auditLog.renameFolder({ folderId, displayName: streamedName });

    await auditLog.expectSinkRun({ flowId: sink.flowId, text: streamedName });

    await streamingPage.deleteDestination(sink.webhookUrl);
    await streamingPage.expectLiveDestinations();
    await expect(streamingPage.row(sink.webhookUrl)).toBeHidden();
    expect(await auditLog.readDestinationIds()).not.toContain(destinationId);
  });

  test('a destination with an invalid URL shows an error', async ({ page }) => {
    const streamingPage = new EventStreamingPage(page);
    const createRequests = streamingPage.countCreateRequests();

    await streamingPage.expectLiveDestinations();
    await streamingPage.startWebhookDestination({ event: 'Folder updated' });
    await streamingPage.urlField().fill('not a url');
    await streamingPage.submit();

    await expect(streamingPage.urlField()).toHaveAttribute('aria-invalid', 'true');
    await expect(streamingPage.urlField()).toHaveAccessibleDescription(/Invalid URL/);
    expect(createRequests()).toBe(0);
  });
});
