import { expect, test } from '../../fixtures';
import { publishVersions } from '../../fixtures/publish-versions';
import scheduleBadCron from '../../fixtures/templates/schedule-bad-cron.json';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { AutomationsPage } from '../../pages/automations.page';
import { BuilderPage } from '../../pages/builder.page';
import { VersionsPage } from '../../pages/versions.page';

test.describe('Publish and versions', { tag: ['@feature:publish'] }, () => {
  test.describe.configure({ timeout: 120000 });

  test('republish runs the new version on the same webhook', async ({ page, request, session, seed }) => {
    const { flowId, webhookUrl } = await seed.flow({ template: webhookEcho, publish: true });
    const builderPage = new BuilderPage(page);
    await builderPage.expectSyncWebhookResponse({ url: `${webhookUrl}/sync?value=v1`, expected: { value: 'v1' } });
    await publishVersions.draftResponseBody({ request, session, flowId, body: '{"version": "v2"}' });

    await new VersionsPage(page).visitFlow(flowId);
    await builderPage.publish();

    await builderPage.expectSyncWebhookResponse({ url: `${webhookUrl}/sync?value=v1`, expected: { version: 'v2' } });
  });

  test('a turned-off flow starts no run from its webhook', async ({ page, request, session, seed }) => {
    const { flowId, webhookUrl } = await seed.flow({ template: webhookEcho, publish: true });
    const versionsPage = new VersionsPage(page);
    const live = await request.get(`${webhookUrl}/sync?value=on`);
    expect(live.status(), 'The live flow answers its webhook').toBe(200);
    expect(await live.json()).toEqual({ value: 'on' });
    await expect.poll(() => publishVersions.countRuns({ request, session, flowId })).toBe(1);

    await versionsPage.visitFlow(flowId);
    await versionsPage.turnOff();

    const off = await request.get(`${webhookUrl}/sync?value=off`);
    expect(off.status()).toBe(404);
    expect(await publishVersions.countRuns({ request, session, flowId })).toBe(1);
    expect((await publishVersions.readFlow({ request, session, flowId })).status).toBe('DISABLED');
  });

  test('the switch of a never-published flow asks to publish first', { tag: '@surface' }, async ({ page, request, session, seed }) => {
    const { flowId, flowName } = await seed.flow({ template: webhookEcho, publish: false });
    const automationsPage = new AutomationsPage(page);
    const versionsPage = new VersionsPage(page);
    const toggle = versionsPage.statusSwitchOfRow(automationsPage.row(flowName));
    await automationsPage.searchFlows(flowName);
    await expect(toggle).toBeVisible({ timeout: 30000 });

    await expect(toggle).toBeDisabled();
    await versionsPage.expectTooltipOf({ element: toggle, text: 'Please publish flow first' });

    await publishVersions.publish({ request, session, flowId });
    await automationsPage.searchFlows(flowName);
    await expect(toggle).toBeVisible({ timeout: 30000 });
    await expect(toggle).toBeEnabled();
    await expect(toggle).toBeChecked();
  });

  test('an older version becomes the draft and the live version keeps running', { tag: '@surface' }, async ({ page, request, session, seed }) => {
    const { flowId, webhookUrl } = await seed.flow({ template: webhookEcho, publish: true });
    const firstBody = publishVersions.responseBodyOf((await publishVersions.readFlow({ request, session, flowId })).version.trigger);
    await publishVersions.publishResponseBody({ request, session, flowId, body: '{"version": "v2"}' });
    const versionsPage = new VersionsPage(page);

    await versionsPage.visitFlow(flowId);
    await versionsPage.openVersions();
    await versionsPage.useAsDraft(1);

    const flow = await publishVersions.readFlow({ request, session, flowId });
    expect(flow.version.state).toBe('DRAFT');
    expect(publishVersions.responseBodyOf(flow.version.trigger)).toBe(firstBody);
    await new BuilderPage(page).expectSyncWebhookResponse({ url: `${webhookUrl}/sync?value=v1`, expected: { version: 'v2' } });
  });

  test('the version history scrolls to the first version', async ({ page, request, session, seed }) => {
    const { flowId } = await seed.flow({ template: webhookEcho, publish: true });
    for (const version of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      await publishVersions.publishResponseBody({ request, session, flowId, body: `{"version": "v${version}"}` });
    }
    const versionsPage = new VersionsPage(page);

    await versionsPage.visitFlow(flowId);
    await versionsPage.openVersions();
    await versionsPage.scrollVersionsDownFrom(12);

    await expect(versionsPage.versionCard(1)).toBeInViewport({ ratio: 1 });
  });

  test('a publish that the trigger refuses shows the reason', async ({ page, request, session, seed }) => {
    const { flowId } = await seed.flow({ template: scheduleBadCron, publish: false });
    const versionsPage = new VersionsPage(page);
    await versionsPage.visitFlow(flowId);

    const failure = await versionsPage.publishExpectingRefusal();

    await expect(failure).toContainText('The connected app reported');
    await expect(failure).toContainText('Invalid cron expression');
    expect((await publishVersions.readFlow({ request, session, flowId })).status).toBe('DISABLED');
  });
});
