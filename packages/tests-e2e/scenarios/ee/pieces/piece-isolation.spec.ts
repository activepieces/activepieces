import { gzipSync } from 'node:zlib';

import { test } from '../../../fixtures';

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

    const tarball = createGzippedTarball('package/package.json', badPackageJson);

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
      '{"runVersion": "{{trigger[\'output\'][\'queryParams\'][\'runVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await builderPage.publishFlow();

    await builderPage.expectSyncWebhookResponse({
      url: `${webhookUrl}/sync?runVersion=${runVersion}`,
      key: 'runVersion',
      expected: runVersion.toString(),
    });
  });
});

// Build a minimal gzipped ustar archive in memory using only Node built-ins,
// so the test does not depend on tar-stream (unavailable in the Checkly runtime)
// or dynamic imports (unsupported in its sandbox). Numeric header fields (uid,
// gid, mtime) are left as the zero-fill, which tar reads as 0.
function createGzippedTarball(name: string, content: string): Buffer {
  const data = Buffer.from(content, 'utf8');
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, 'utf8');
  header.write('0000644\0', 100, 8, 'utf8'); // mode
  header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'utf8'); // size
  header.write('0', 156, 1, 'utf8'); // typeflag: regular file
  header.write('ustar\0', 257, 6, 'utf8'); // magic
  header.write('00', 263, 2, 'utf8'); // version
  header.fill(' ', 148, 156); // checksum field is spaces while summing
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'utf8');
  const padding = (512 - (data.length % 512)) % 512;
  return gzipSync(
    Buffer.concat([header, data, Buffer.alloc(padding), Buffer.alloc(1024)]),
  );
}
