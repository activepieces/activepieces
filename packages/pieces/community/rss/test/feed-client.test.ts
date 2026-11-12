import { describe, expect, it } from 'vitest';
import { rssFeedClient } from '../src/lib/common/feed-client';

const FEED_URL = 'https://news.test/blog/feed.xml';
const BODY = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog</title>` +
  `<link>https://example.test/</link><description>d</description>` +
  `<item><title>Post</title><link>posts/1</link><guid isPermaLink="false">p1</guid>` +
  `<pubDate>Mon, 19 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`;

describe('rssFeedClient.parseFeed (AI actions)', () => {
  it('resolves relative item links against the feed URL and reports the feed URL', async () => {
    const { feed, items } = await rssFeedClient.parseFeed({ body: BODY, url: FEED_URL });
    expect(items[0].link).toBe('https://news.test/blog/posts/1');
    expect(feed.feed_url).toBe(FEED_URL);
  });
});
