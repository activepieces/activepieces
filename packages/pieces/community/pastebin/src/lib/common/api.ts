import { HttpError } from '@activepieces/pieces-common';

import { pastebinClient } from './client';

import type {
  PastebinAuthValue,
  PastebinAccount,
  PastebinCreatePasteRequest,
  PastebinPaste,
} from './types';

async function login({
  auth,
  username,
  password,
}: {
  auth: PastebinAuthValue;
  username: string;
  password: string;
}): Promise<string> {
  return await pastebinClient.request({
    auth,
    script: 'api_login.php',
    option: 'login',
    fields: { user_name: username, user_password: password },
  });
}

async function getUserKey({
  auth,
}: {
  auth: PastebinAuthValue;
}): Promise<string | undefined> {
  const { username, password } = auth.props;
  if (username && password) {
    return await login({ auth, username, password });
  }
  return undefined;
}

async function requireUserKey({
  auth,
}: {
  auth: PastebinAuthValue;
}): Promise<string> {
  const userKey = await getUserKey({ auth });
  if (!userKey) {
    throw new Error(
      'This action works on your own pastes: add your Pastebin username and password to the connection.'
    );
  }
  return userKey;
}

async function createPaste({
  auth,
  paste,
}: {
  auth: PastebinAuthValue;
  paste: PastebinCreatePasteRequest;
}): Promise<string> {
  const userKey = await getUserKey({ auth });
  return await pastebinClient.request({
    auth,
    userKey,
    script: 'api_post.php',
    option: 'paste',
    fields: paste,
  });
}

async function getPasteContent({
  auth,
  pasteKey,
}: {
  auth: PastebinAuthValue;
  pasteKey: string;
}): Promise<string> {
  const userKey = await getUserKey({ auth });
  if (userKey) {
    return await pastebinClient.request({
      auth,
      userKey,
      script: 'api_raw.php',
      option: 'show_paste',
      fields: { paste_key: pasteKey },
    });
  }
  return await pastebinClient.getText({ path: `/raw/${pasteKey}` });
}

async function verifyCredentials({
  auth,
}: {
  auth: PastebinAuthValue;
}): Promise<boolean> {
  const { username, password } = auth.props;
  try {
    if (username && password) {
      await login({ auth, username, password });
      return true;
    }
    await pastebinClient.request({
      auth,
      script: 'api_post.php',
      option: 'userdetails',
      fields: {},
    });
    return true;
  } catch (error) {
    if (
      error instanceof HttpError &&
      REJECTED_STATUSES.includes(error.response.status)
    ) {
      if (username && password) {
        return false;
      }
      return !JSON.stringify(error.response.body).includes(
        'invalid api_dev_key'
      );
    }
    throw error;
  }
}

async function listPastes({
  auth,
  limit,
}: {
  auth: PastebinAuthValue;
  limit?: number;
}): Promise<PastebinPaste[]> {
  const userKey = await requireUserKey({ auth });
  const xml = await pastebinClient.request({
    auth,
    userKey,
    script: 'api_post.php',
    option: 'list',
    fields: {
      results_limit: limit === undefined ? undefined : String(limit),
    },
  });
  return parseElements({ xml, tag: 'paste' });
}

async function deletePaste({
  auth,
  pasteKey,
}: {
  auth: PastebinAuthValue;
  pasteKey: string;
}): Promise<string> {
  const userKey = await requireUserKey({ auth });
  return await pastebinClient.request({
    auth,
    userKey,
    script: 'api_post.php',
    option: 'delete',
    fields: { paste_key: pasteKey },
  });
}

async function getAccountDetails({
  auth,
}: {
  auth: PastebinAuthValue;
}): Promise<PastebinAccount> {
  const userKey = await requireUserKey({ auth });
  const xml = await pastebinClient.request({
    auth,
    userKey,
    script: 'api_post.php',
    option: 'userdetails',
    fields: {},
  });
  const [account] = parseElements({ xml, tag: 'user' });
  if (!account) {
    throw new Error(`Unexpected response from Pastebin: ${xml}`);
  }
  return account;
}

function parseElements({
  xml,
  tag,
}: {
  xml: string;
  tag: string;
}): Record<string, string>[] {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  return [...xml.matchAll(pattern)].map((match) =>
    Object.fromEntries(
      [...match[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)].map(
        ([, key, value]) => [key, decodeEntities({ text: value })]
      )
    )
  );
}

function decodeEntities({ text }: { text: string }): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');
}

export const pastebinApi = {
  getUserKey,
  createPaste,
  getPasteContent,
  verifyCredentials,
  listPastes,
  deletePaste,
  getAccountDetails,
};

const REJECTED_STATUSES = [401, 422];
