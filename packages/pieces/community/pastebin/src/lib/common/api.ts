import { pastebinClient } from './client';

import type { PastebinAuthValue, PastebinCreatePasteRequest } from './types';

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

export const pastebinApi = { getUserKey, createPaste, getPasteContent };
