import { expect, test } from '../../../fixtures/embed';
import { EmbeddedBuilderPage, EmbedPage } from '../../../pages/embed.page';

test.describe('Embedded builder', { tag: ['@feature:embed-builder', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('create a signing key and open the embedded builder with a JWT signed by it', async ({ page, cleanup, embed }) => {
    const embedPage = new EmbedPage(page);
    await embedPage.visitSigningKeys();
    const displayName = embed.uniqueKeyName();
    const signingKey = await embedPage.createSigningKey({
      displayName,
      onCreated: (signingKeyId) => cleanup.track({ resource: 'signing-keys', id: signingKeyId }),
    });
    await embedPage.reload();
    await expect(embedPage.signingKeyRow(displayName)).toBeVisible();

    const token = embed.signToken({ signingKey });
    const embedded = await embed.exchange({ token });
    const flow = await embed.seedFlow({ projectId: embedded.projectId });
    const builder = new EmbeddedBuilderPage(await embed.hostPage());
    const opened = await builder.open({ token, initialRoute: `/flows/${flow.flowId}`, disableNavigation: false });

    expect(opened.projectId, 'The embed did not sign in to the project of the first exchange').toBe(embedded.projectId);
    await expect(builder.step('trigger')).toBeVisible();
    await expect(builder.flowName()).toContainText(flow.flowName);
    await expect(builder.homeButton()).toBeVisible();
  });

  test('the embedded builder hides the navigation that the SDK config hides', async ({ embed }) => {
    const signingKey = await embed.createSigningKey();
    const token = embed.signToken({ signingKey });
    const embedded = await embed.exchange({ token });
    const flow = await embed.seedFlow({ projectId: embedded.projectId });
    const builder = new EmbeddedBuilderPage(await embed.hostPage());

    await builder.open({ token, initialRoute: `/flows/${flow.flowId}`, disableNavigation: true });

    await expect(builder.flowName()).toContainText(flow.flowName);
    await expect(builder.homeButton()).toBeHidden();
  });

  test('a JWT signed by a deleted key is refused', async ({ page, embed }) => {
    const signingKey = await embed.createSigningKey();
    const token = embed.signToken({ signingKey });
    await embed.exchange({ token });
    const embedPage = new EmbedPage(page);
    await embedPage.visitSigningKeys();

    await embedPage.deleteSigningKey(signingKey.displayName);
    await embedPage.reload();

    await expect(embedPage.signingKeyRow(signingKey.displayName)).toBeHidden();
    expect(await embed.exchangeStatus({ token })).toBe(401);
  });
});
