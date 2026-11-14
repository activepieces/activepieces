import * as http from 'node:http';
import {
  createMockPollingTriggerContext,
  FilesService,
  InputPropertyMap,
  StaticPropsValue,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

async function start(): Promise<FakeFeedServer> {
  const feeds = new Map<string, FakeFeed>();
  const server = createServer((req, res) => {
    const feed = feeds.get(req.url ?? '');
    if (feed === undefined) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    if (feed.mode === 'hang') {
      return;
    }
    if (feed.mode === 'error') {
      res.writeHead(500);
      res.end('upstream error');
      return;
    }
    const visible = feed.entries.filter((entry) => !entry.deleted);
    const ordered = feed.order === 'oldest-first' ? [...visible].reverse() : visible;
    res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8' });
    res.end(renderRss({ title: req.url ?? 'feed', entries: ordered }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;
  return {
    url: (path) => `http://127.0.0.1:${port}${path}`,
    feed: (path) => {
      const existing = feeds.get(path);
      if (existing) {
        return existing;
      }
      const created: FakeFeed = { entries: [], mode: 'ok', order: 'newest-first' };
      feeds.set(path, created);
      return created;
    },
    reset: () => feeds.clear(),
    stop: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

function publish({ feed, guid, at, link }: { feed: FakeFeed; guid: string; at: string | null; link?: string }): void {
  feed.entries.unshift({ guid, publishedAt: at, deleted: false, link: link ?? `https://example.test/${guid}` });
}

function memoryStore(): MemoryStore {
  const data = new Map<string, string>();
  return {
    data,
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

function guids(items: unknown[]): string[] {
  return items.map((item) => stringField({ item, key: 'guid' }));
}

function titles(items: unknown[]): string[] {
  return items.map((item) => stringField({ item, key: 'title' }));
}

function stringField({ item, key }: { item: unknown; key: string }): string {
  if (typeof item !== 'object' || item === null) {
    return '';
  }
  const value: unknown = Reflect.get(item, key);
  return typeof value === 'string' ? value : '';
}

function triggerContext<Props extends InputPropertyMap>({
  propsValue,
  store,
  isRepublish,
}: {
  trigger: { props: Props };
  propsValue: StaticPropsValue<Props>;
  store: Store;
  isRepublish?: boolean;
}) {
  return {
    ...createMockPollingTriggerContext<Props>({ propsValue }),
    store,
    files: unusedFiles,
    isRepublish,
  };
}

const unusedFiles: FilesService = {
  write: async () => {
    throw new Error('files are not used by the RSS triggers');
  },
  upload: async () => {
    throw new Error('files are not used by the RSS triggers');
  },
};

function asPolling<T extends { type: TriggerStrategy }>(trigger: T): Extract<T, { type: TriggerStrategy.POLLING }> {
  if (!isPolling(trigger)) {
    throw new Error('expected a polling trigger');
  }
  return trigger;
}

function isPolling<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.POLLING }> {
  return trigger.type === TriggerStrategy.POLLING;
}

async function startRouteServer(): Promise<RouteFeedServer> {
  const routes = new Map<string, FeedRoute>();
  const server = await startServer((req, res) => {
    const route = routes.get(req.url ?? '');
    const reply = () => {
      if (!route) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(route.status ?? 200, { 'content-type': route.contentType ?? 'application/rss+xml; charset=utf-8' });
      res.end(route.body);
    };
    if (route?.delayMs) {
      setTimeout(reply, route.delayMs);
    } else {
      reply();
    }
  });
  return {
    url: (path) => server.base + path,
    set: (path, route) => {
      routes.set(path, route);
    },
    stop: server.stop,
  };
}

function rssDocument({ title, items }: { title: string; items: DatedItem[] }): string {
  const body = items
    .map((i) => `    <item>\n      <title>${i.title}</title>\n      <link>https://example.com/${i.guid}</link>\n      <guid isPermaLink="false">${i.guid}</guid>\n      <pubDate>${i.pubDate.toUTCString()}</pubDate>\n    </item>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${title}</title>\n    <link>https://example.com/</link>\n    <description>${title}</description>\n${body}\n  </channel>\n</rss>\n`;
}

function storeValue({ store, key }: { store: MemoryStore; key: string }): unknown {
  const raw = store.data.get(key);
  return raw === undefined ? undefined : JSON.parse(raw);
}

function startServer(handler: http.RequestListener): Promise<RawFeedServer> {
  const server = createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      resolve({
        base: `http://127.0.0.1:${port}`,
        stop: async () => {
          server.closeAllConnections();
          await new Promise<void>((done) => server.close(() => done()));
        },
      });
    });
  });
}

function createServer(handler: http.RequestListener): http.Server {
  return http.createServer((req, res) => {
    res.setHeader('connection', 'close');
    handler(req, res);
  });
}

export const fakeFeeds = { asPolling, start, startServer, startRouteServer, rssDocument, publish, memoryStore, storeValue, guids, titles, triggerContext };

function renderRss({ title, entries }: { title: string; entries: FakeEntry[] }): string {
  const items = entries
    .map(
      (entry) =>
        `<item><title>${entry.guid}</title><link>${entry.link}</link>` +
        `<guid>${entry.guid}</guid>` +
        (entry.publishedAt === null ? '' : `<pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>`) +
        `<dc:creator>author</dc:creator><category>news</category><comments>https://example.test/${entry.guid}#c</comments>` +
        `<description>${entry.guid} body</description></item>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${title}</title>` +
    `<link>https://example.test/</link><description>d</description>${items}</channel></rss>`;
}

export type FakeEntry = { guid: string; publishedAt: string | null; deleted: boolean; link: string };

export type FakeFeed = {
  entries: FakeEntry[];
  mode: 'ok' | 'error' | 'hang';
  order: 'newest-first' | 'oldest-first';
};

export type FakeFeedServer = {
  url: (path: string) => string;
  feed: (path: string) => FakeFeed;
  reset: () => void;
  stop: () => Promise<void>;
};

export type MemoryStore = {
  data: Map<string, string>;
  put: <T>(key: string, value: T) => Promise<T>;
  get: <T>(key: string) => Promise<T | null>;
  delete: (key: string) => Promise<void>;
};

export type RawFeedServer = {
  base: string;
  stop: () => Promise<void>;
};

export type FeedRoute = {
  status?: number;
  delayMs?: number;
  contentType?: string;
  body: Buffer | string;
};

export type RouteFeedServer = {
  url: (path: string) => string;
  set: (path: string, route: FeedRoute) => void;
  stop: () => Promise<void>;
};

export type DatedItem = { guid: string; title: string; pubDate: Date };
