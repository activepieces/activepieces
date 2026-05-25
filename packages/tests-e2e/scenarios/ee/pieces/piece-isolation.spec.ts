import { test, expect } from '../../../fixtures';

/**
 * EE: Bad piece isolation test.
 *
 * Uploads a custom piece whose package.json contains a workspace:* dependency
 * (simulating an accidentally mis-published piece). Verifies that the bad piece's
 * install failure does NOT prevent a standard Webhook flow from succeeding.
 *
 * Requires a platform admin token (EE only).
 */
test.describe('Piece isolation — EE', () => {
  test('broken custom piece does not prevent webhook flow from running', async ({ page, automationsPage, builderPage, request }) => {
    test.setTimeout(180000);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Upload a bad custom piece that has workspace:* in its dependencies.
    // The archive is a minimal tarball with a package.json that contains a
    // workspace protocol dependency which bun cannot resolve on install.
    const badPackageJson = JSON.stringify({
      name: '@test/broken-piece',
      version: '0.0.1',
      dependencies: {
        'some-internal-package': 'workspace:*',
      },
    });

    const { Readable } = await import('node:stream');
    const tar = await import('tar-stream');
    const zlib = await import('node:zlib');

    const pack = tar.pack();
    pack.entry({ name: 'package/package.json' }, badPackageJson);
    pack.finalize();

    const chunks: Buffer[] = [];
    for await (const chunk of pack.pipe(zlib.createGzip())) {
      chunks.push(chunk as Buffer);
    }
    const tarball = Buffer.concat(chunks);

    // POST the broken piece archive to the platform pieces endpoint
    const uploadResponse = await request.post('/api/v1/pieces', {
      headers: authHeaders,
      multipart: {
        pieceArchive: {
          name: 'broken-piece.tgz',
          mimeType: 'application/gzip',
          buffer: tarball,
        },
      },
    });

    // Upload may fail with 4xx if EE endpoint is not available — skip gracefully
    test.skip(uploadResponse.status() === 404, 'Piece upload endpoint not available in this build');

    // Even if the upload succeeds and bun fails to install the broken piece,
    // a regular Webhook flow must still execute successfully
    await automationsPage.waitFor();
    await automationsPage.newFlowFromScratch();

    await builderPage.selectInitialTrigger({
      piece: 'Webhook',
      trigger: 'Catch Webhook'
    });

    const webhookInput = page.locator('input.grow.bg-background');
    const webhookUrl = await webhookInput.inputValue();

    await builderPage.testTrigger();

    const runVersion = Math.floor(Math.random() * 100000);
    await page.context().request.get(`${webhookUrl}?runVersion=${runVersion}`);
    await page.waitForTimeout(3000);

    await builderPage.addAction({
      piece: 'Webhook',
      action: 'Return Response'
    });

    await page.locator('div.cm-activeLine.cm-line').fill('');
    await page.locator('div.cm-activeLine.cm-line').fill(
      '{"runVersion": "{{trigger[\'queryParams\'][\'runVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await builderPage.publishFlow();

    const response = await page.context().request.get(`${webhookUrl}/sync?runVersion=${runVersion}`);
    const body = await response.json();

    expect(body.runVersion).toBe(runVersion.toString());
  });
});
