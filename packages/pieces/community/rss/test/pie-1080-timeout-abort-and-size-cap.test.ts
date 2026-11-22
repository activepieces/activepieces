import * as http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssFeedClient } from '../src/lib/common/feed-client';
import { fakeFeeds, RawFeedServer } from './helpers/fake-feeds';

let server: RawFeedServer;
const sockets = { endlessClosed: false, declaredClosed: false, noHeadersClosed: false };
const accepts = new Map<string, string>();
const SMALL_FEED =
  '<?xml version="1.0"?><rss version="2.0"><channel><title>t</title><link>https://h.test/</link><description>d</description>' +
  '<item><title>one</title><link>https://h.test/one</link><guid>one</guid><pubDate>Tue, 20 Oct 2026 08:00:00 GMT</pubDate></item></channel></rss>';
const HUGE_BYTES = 25 * 1024 * 1024;

beforeAll(async () => {
  server = await fakeFeeds.startServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    accepts.set(req.url ?? '', req.headers.accept ?? '');
    if (req.url === '/declared-huge.xml') {
      res.writeHead(200, { 'content-type': 'application/rss+xml', 'content-length': String(HUGE_BYTES) });
      res.write('<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>');
      req.socket.on('close', () => {
        sockets.declaredClosed = true;
      });
      return;
    }
    if (req.url === '/no-headers.xml') {
      req.socket.on('close', () => {
        sockets.noHeadersClosed = true;
      });
      return;
    }
    if (req.url === '/small.xml') {
      res.writeHead(200, { 'content-type': 'application/rss+xml' });
      res.end(SMALL_FEED);
      return;
    }
    if (req.url === '/huge-page.html') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(`<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head><body>${'x'.repeat(HUGE_BYTES)}</body></html>`);
      return;
    }
    if (req.url === '/page.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end('\ufeff<html><head><title>caf\u00e9</title></head></html>');
      return;
    }
    if (req.url === '/endless.xml') {
      res.writeHead(200, { 'content-type': 'application/rss+xml' });
      res.write('<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>');
      const timer = setInterval(() => res.write('<!-- still streaming -->'), 200);
      req.socket.on('close', () => {
        clearInterval(timer);
        sockets.endlessClosed = true;
      });
      return;
    }
    if (req.url === '/huge.xml') {
      const padding = 'x'.repeat(HUGE_BYTES);
      res.writeHead(200, { 'content-type': 'application/rss+xml' });
      res.end(
        `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title><link>https://h.test/</link><description>d</description>` +
          `<item><title>big</title><link>https://h.test/big</link><guid>big</guid><description>${padding}</description></item></channel></rss>`,
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });
});
afterAll(async () => {
  await server.stop();
});

describe('PIE-1080: feed-client timeout does not cancel, no size cap', () => {
  it('rejects a feed body over the size cap with a clear "too large" error', async () => {
    await expect(rssFeedClient.fetchItems({ url: `${server.base}/huge.xml` })).rejects.toThrow(/too large/i);
  });

  it('cancels the request (closes the connection) when the 20 s limit passes', async () => {
    await expect(rssFeedClient.fetchItems({ url: `${server.base}/endless.xml` })).rejects.toThrow(/timed out/i);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(sockets.endlessClosed).toBe(true);
  }, 30_000);

  it('a server that never sends headers fails with the same "timed out after 20s" error and the connection is closed', async () => {
    await expect(rssFeedClient.fetchItems({ url: `${server.base}/no-headers.xml` })).rejects.toThrow(
      /Could not load .*no-headers\.xml: timed out after 20s/,
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(sockets.noHeadersClosed).toBe(true);
  }, 30_000);

  it('rejects at once when content-length announces a body over the cap, without waiting for the body', async () => {
    const started = Date.now();
    await expect(rssFeedClient.fetchItems({ url: `${server.base}/declared-huge.xml` })).rejects.toThrow(
      /Could not load .*declared-huge\.xml: the response is too large \(more than 20 MB\)/,
    );
    expect(Date.now() - started).toBeLessThan(5_000);
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(sockets.declaredClosed).toBe(true);
  });

  it('control: a normal feed still parses, for the trigger client and the Read Feed client', async () => {
    const items = await rssFeedClient.fetchItems({ url: `${server.base}/small.xml` });
    expect(items.map((item) => item.guid)).toEqual(['one']);
    const parsed = await rssFeedClient.fetchFeed({ url: `${server.base}/small.xml` });
    expect(parsed.items.map((item) => item.link)).toEqual(['https://h.test/one']);
  });

  it('asks for a feed format instead of the JSON default', async () => {
    await rssFeedClient.fetchItems({ url: `${server.base}/small.xml` });
    expect(accepts.get('/small.xml')).toMatch(/^application\/rss\+xml/);
  });

  it('Find Site Feeds (fetchPage) honours the same cap', async () => {
    await expect(rssFeedClient.fetchPage({ url: `${server.base}/huge-page.html` })).rejects.toThrow(/too large/i);
  });

  it('fetchPage decodes the page as UTF-8 text and keeps the content type', async () => {
    const page = await rssFeedClient.fetchPage({ url: `${server.base}/page.html` });
    expect(page.body).toBe('<html><head><title>caf\u00e9</title></head></html>');
    expect(page.contentType).toBe('text/html; charset=utf-8');
    expect(accepts.get('/page.html')).toMatch(/^text\/html/);
  });
});
