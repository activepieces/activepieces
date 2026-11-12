import { expect, type APIRequestContext } from '@playwright/test';

function connect({ request }: { request: APIRequestContext }): Mailbox {
  const mailUrl = process.env.E2E_MAIL_URL;
  if (!mailUrl) {
    throw new Error('E2E_MAIL_URL is not set, so no spec can read the mail the app sends. See "Environment" in packages/tests-e2e/README.md.');
  }
  return {
    linkTo: async ({ to, path }) => {
      await expect(() => findLink({ request, mailUrl, to, path })).toPass({ timeout: MAIL_TIMEOUT_MS });
      return findLink({ request, mailUrl, to, path });
    },
  };
}

async function findLink({ request, mailUrl, to, path }: { request: APIRequestContext; mailUrl: string; to: string; path: string }): Promise<URL> {
  const search = await request.get(`${mailUrl}/api/v1/search`, { params: { query: `to:${to}` } });
  if (!search.ok()) {
    throw new Error(`Mailpit search returned ${search.status()}: ${await search.text()}`);
  }
  const { messages }: { messages: { ID: string }[] } = await search.json();
  const bodies = await Promise.all(messages.map(({ ID }) => readHtml({ request, mailUrl, id: ID })));
  const link = bodies.flatMap(linksIn).find((url) => url.pathname.endsWith(path));
  if (!link) {
    throw new Error(`No mail to ${to} links to ${path} yet`);
  }
  return link;
}

async function readHtml({ request, mailUrl, id }: { request: APIRequestContext; mailUrl: string; id: string }): Promise<string> {
  const response = await request.get(`${mailUrl}/api/v1/message/${id}`);
  if (!response.ok()) {
    throw new Error(`Reading mail ${id} returned ${response.status()}`);
  }
  const message: { HTML: string } = await response.json();
  return message.HTML;
}

function linksIn(html: string): URL[] {
  return [...html.matchAll(/href="(https?:[^"]+)"/g)].map(([, href]) => new URL(decodeEntities(href)));
}

function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g, (entity) => MUSTACHE_ENTITIES[entity]);
}

const MAIL_TIMEOUT_MS = 15_000;
const MUSTACHE_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '=',
};

export const e2eMail = { connect };

export type Mailbox = {
  linkTo: (params: { to: string; path: string }) => Promise<URL>;
};
