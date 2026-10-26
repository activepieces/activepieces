import { HttpMethod } from '@activepieces/pieces-common';
import CryptoJS from 'crypto-js';
import { createHash } from 'crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import createPaste from '../src/lib/actions/create-paste';
import getPaste from '../src/lib/actions/get-paste';
import editPaste from '../src/lib/actions/edit-paste';
import deletePaste from '../src/lib/actions/delete-paste';
import deleteFolder from '../src/lib/actions/delete-folder';
import getFolderHierarchy from '../src/lib/actions/get-folder-hierarchy';
import listMyPastes from '../src/lib/actions/list-my-pastes';
import searchPublicPastes from '../src/lib/actions/search-public-pastes';
import deleteFolderAi from '../src/lib/actions/ai/delete-folder-ai';
import listFolders from '../src/lib/actions/ai/list-folders';
import createFolderAi from '../src/lib/actions/ai/create-folder-ai';
import pasteChanged from '../src/lib/triggers/paste-changed';
import { pastefyClient, PastefyApiError } from '../src/lib/common/client';
import { pastefyRequests } from '../src/lib/common/requests';
import { pastefyAuth } from '../src/lib/common/auth';
import editPasteAi from '../src/lib/actions/ai/edit-paste-ai';
import { replies, run, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const PASTE = { exists: true, id: 'abc12345', title: 't', content: 'c', encrypted: false, folder: 'f1', visibility: 'UNLISTED' };

describe('client', () => {
  test('uses the connection instance URL and trimmed bearer key', async () => {
    const seen = stubFetch(replies([{ body: PASTE }]));
    await run(getPaste)({ paste_id: 'abc12345' });
    expect(seen[0].url).toBe('https://paste.example.com/api/v2/paste/abc12345');
    expect(seen[0].auth).toBe('Bearer key-1');
  });

  test('defaults to pastefy.app and rejects bad instance URLs', () => {
    expect(pastefyClient.apiBase({ auth: { props: { token: 'k' } } })).toBe('https://pastefy.app/api/v2');
    expect(() => pastefyClient.apiBase({ auth: { props: { instance_url: 'ftp://x', token: 'k' } } })).toThrow(/plain http/);
    expect(() => pastefyClient.apiBase({ auth: { props: { instance_url: 'https://u:p@x.io', token: 'k' } } })).toThrow(/plain http/);
  });

  test('path IDs are encoded', async () => {
    const seen = stubFetch(replies([{ body: PASTE }]));
    await run(getPaste)({ paste_id: 'a/b?c' });
    expect(seen[0].path).toBe('/api/v2/paste/a%2Fb%3Fc');
  });

  test('errors keep the vendor exception in responseBody', async () => {
    stubFetch(replies([{ status: 403, body: { success: false, exception: 'PermissionsDeniedException' } }]));
    const error = await run(getPaste)({ paste_id: 'x' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PastefyApiError);
    expect(error).toMatchObject({ status: 403, responseBody: { exception: 'PermissionsDeniedException' } });
    expect(String(error)).toMatch(/PermissionsDeniedException.*permission/);
  });

  test('200 with success:false is an error', async () => {
    stubFetch(replies([{ body: { success: false } }]));
    await expect(pastefyClient.request({ auth: { props: { token: 'k' } }, method: HttpMethod.DELETE, path: '/x' })).rejects.toThrow(/did not apply/);
  });
});

describe('no API key', () => {
  const ANON = { props: { instance_url: 'https://paste.example.com' } };

  test('create and get work anonymously without an Authorization header', async () => {
    const seen = stubFetch(replies([{ body: { success: true, paste: PASTE } }, { body: PASTE }]));
    await run(createPaste)({ content: 'hello' }, ANON);
    await run(getPaste)({ paste_id: 'abc12345' }, ANON);
    expect(seen.map((r) => r.method)).toEqual(['POST', 'GET']);
    expect(seen.every((r) => r.auth === null)).toBe(true);
  });

  test('public search works anonymously', async () => {
    const seen = stubFetch(replies([{ body: [PASTE] }]));
    await run(searchPublicPastes)({ search: 'x' }, ANON);
    expect(seen[0].auth).toBeNull();
  });

  test('account actions fail early with a clear message and send nothing', async () => {
    const seen = stubFetch(replies([{ body: PASTE }]));
    await expect(run(listFolders)({}, ANON)).rejects.toThrow(/needs an API key/);
    await expect(run(listMyPastes)({}, ANON)).rejects.toThrow(/needs an API key/);
    await expect(run(editPasteAi)({ paste_id: 'abc12345', title: 'n' }, ANON)).rejects.toThrow(/needs an API key/);
    await expect(run(deletePaste)({ paste_id: 'abc12345' }, ANON)).rejects.toThrow(/needs an API key/);
    await expect(run(deleteFolderAi)({ folder_id: 'f1' }, ANON)).rejects.toThrow(/needs an API key/);
    expect(seen).toHaveLength(0);
  });

  test('validate accepts a connection without a key and checks a given key', async () => {
    const seen = stubFetch(replies([{ body: { logged_in: true } }]));
    expect(await pastefyAuth.validate?.({ auth: { instance_url: 'https://paste.example.com' }, server: { apiUrl: '', publicUrl: '' } })).toEqual({ valid: true });
    expect(seen).toHaveLength(0);
    expect(await pastefyAuth.validate?.({ auth: { instance_url: 'https://paste.example.com', token: 'k' }, server: { apiUrl: '', publicUrl: '' } })).toEqual({ valid: true });
    expect(seen[0].auth).toBe('Bearer k');
  });
});

describe('pastes', () => {
  test('create encrypts content and title, formats expiry in UTC, sends tags', async () => {
    const seen = stubFetch((request) => ({ body: { success: true, paste: { ...PASTE, ...request.body, folder: null } } }));
    const out = await run(createPaste)({ content: 'secret', title: 'name', password: 'pw', expiry: '2099-01-02T03:04:05+02:00', tags: ['a', ' a ', 'b'] });
    const body = seen[0].body;
    expect(body['encrypted']).toBe(true);
    expect(CryptoJS.AES.decrypt(String(body['content']), 'pw').toString(CryptoJS.enc.Utf8)).toBe('secret');
    expect(body['expire_at']).toBe('2099-01-02 01:04:05');
    expect(body['tags']).toEqual(['a', 'b']);
    expect(body).not.toHaveProperty('folder');
    expect(out).toMatchObject({ content: 'secret', title: 'name', decrypted: true });
  });

  test('create rejects a bad or past expiry before any request', async () => {
    const seen = stubFetch(replies([{ body: {} }]));
    await expect(run(createPaste)({ content: 'x', expiry: 'tomorrow' })).rejects.toThrow(/not a valid date/);
    await expect(run(createPaste)({ content: 'x', expiry: '2001-01-01T00:00:00Z' })).rejects.toThrow(/future/);
    expect(seen).toHaveLength(0);
  });

  test('create checks the folder first, so a bad folder creates nothing', async () => {
    const seen = stubFetch(replies([{ status: 404, body: { exception: 'NotFoundException' } }]));
    await expect(run(createPaste)({ content: 'x', folder_id: 'nope' })).rejects.toThrow(/404/);
    expect(seen).toHaveLength(1);
  });

  test('create fails loudly when Pastefy ignored the folder', async () => {
    stubFetch(replies([{ body: { exists: true, id: 'f9' } }, { body: { success: true, paste: { ...PASTE, folder: null } } }]));
    await expect(run(createPaste)({ content: 'x', folder_id: 'f9' })).rejects.toThrow(/did not put it in folder f9/);
  });

  test('get with wrong password fails, right password decrypts', async () => {
    const enc = { ...PASTE, encrypted: true, content: CryptoJS.AES.encrypt('hi', 'pw').toString(), title: CryptoJS.AES.encrypt('tt', 'pw').toString() };
    stubFetch(replies([{ body: enc }]));
    await expect(run(getPaste)({ paste_id: 'p', password: 'nope' })).rejects.toThrow(/Wrong Encryption Password/);
    expect(await run(getPaste)({ paste_id: 'p', password: 'pw' })).toMatchObject({ content: 'hi', title: 'tt', decrypted: true });
    expect(await run(getPaste)({ paste_id: 'p' })).toMatchObject({ content: enc.content, decrypted: false });
  });

  test('edit of only the folder keeps encryption and returns the re-read paste', async () => {
    const enc = { ...PASTE, encrypted: true, content: CryptoJS.AES.encrypt('hi', 'pw').toString() };
    const seen = stubFetch(replies([{ body: enc }, { body: { success: true } }, { body: { ...enc, folder: 'f2' } }]));
    const out = await run(editPaste)({ paste_id: 'p', folder_id: 'f2', tags: [] });
    expect(seen[1]).toMatchObject({ method: 'PUT', body: { folder: 'f2' } });
    expect(seen[1].body).not.toHaveProperty('encrypted');
    expect(seen[1].body).not.toHaveProperty('tags');
    expect(out).toMatchObject({ folder: 'f2', encrypted: true });
  });

  test('edit refuses new content on an encrypted paste without password', async () => {
    const seen = stubFetch(replies([{ body: { ...PASTE, encrypted: true } }]));
    await expect(run(editPaste)({ paste_id: 'p', content: 'plain' })).rejects.toThrow(/encrypted/);
    expect(seen).toHaveLength(1);
  });

  test('edit clear tags sends an empty list; nothing to update fails', async () => {
    const seen = stubFetch(replies([{ body: PASTE }, { body: { success: true } }, { body: PASTE }]));
    await run(editPaste)({ paste_id: 'p', clear_tags: true });
    expect(seen[1].body).toEqual({ tags: [] });
    stubFetch(replies([{ body: PASTE }]));
    await expect(run(editPaste)({ paste_id: 'p' })).rejects.toThrow(/Nothing to update/);
  });

  test('delete paste twice: second returns deleted false', async () => {
    stubFetch(replies([{ body: { success: true } }, { status: 404, body: { success: false, exception: 'NotFoundException' } }]));
    expect(await run(deletePaste)({ paste_id: 'p' })).toEqual({ deleted: true, id: 'p' });
    expect(await run(deletePaste)({ paste_id: 'p' })).toEqual({ deleted: false, id: 'p' });
  });

  test('list my pastes sends page_limit and filters, has_more from a full page', async () => {
    const seen = stubFetch(replies([{ body: [PASTE, PASTE] }]));
    const out = await run(listMyPastes)({ search: 'q', folder_id: 'f1', tags: ['x', 'y'], page: 2, page_limit: 2 });
    expect(seen[0].path).toBe('/api/v2/user/pastes');
    expect(Object.fromEntries(seen[0].query)).toEqual({ page: '2', page_limit: '2', search: 'q', 'filter[folder]': 'f1', filter_tags: 'x,y', shorten_content: 'true' });
    expect(out).toMatchObject({ count: 2, has_more: true, page: 2, page_limit: 2 });
  });

  test('page size over 50 is refused', async () => {
    await expect(run(searchPublicPastes)({ page_limit: 51 })).rejects.toThrow(/1 to 50/);
  });

  test('public search picks the trending list', async () => {
    const seen = stubFetch(replies([{ body: [] }]));
    expect(await run(searchPublicPastes)({ list: 'trending' })).toMatchObject({ has_more: false, count: 0 });
    expect(seen[0].path).toBe('/api/v2/public-pastes/trending');
  });
});

describe('folders', () => {
  const TREE = [{ id: 'a', name: 'A', children: [{ id: 'b', name: 'B', children: [] }] }, { id: 'c', name: 'C', children: [] }];

  test('one tree call with hide_pastes, flattened with paths', async () => {
    const seen = stubFetch(replies([{ body: TREE }]));
    const out = await run(listFolders)({});
    expect(seen).toHaveLength(1);
    expect(seen[0].path).toBe('/api/v2/user/folders');
    expect(seen[0].query.get('hide_pastes')).toBe('true');
    expect(out).toEqual({ count: 3, folders: [
      { id: 'a', name: 'A', path: 'A', parent_id: null },
      { id: 'b', name: 'B', path: 'A / B', parent_id: 'a' },
      { id: 'c', name: 'C', path: 'C', parent_id: null },
    ] });
  });

  test('hierarchy subtree and unknown start folder', async () => {
    stubFetch(replies([{ body: TREE }]));
    expect(await run(getFolderHierarchy)({ parent_id: 'a' })).toEqual([{ id: 'b', name: 'B', children: [] }]);
    await expect(run(getFolderHierarchy)({ parent_id: 'zz' })).rejects.toThrow(/not found/);
  });

  test('create folder checks the parent first', async () => {
    const seen = stubFetch(replies([{ status: 404, body: { exception: 'NotFoundException' } }]));
    await expect(run(createFolderAi)({ name: 'x', parent_folder_id: 'nope' })).rejects.toThrow(/404/);
    expect(seen).toHaveLength(1);
  });

  test('delete folder: AI twin returns deleted false when missing, human fails', async () => {
    stubFetch(replies([{ status: 404, body: { exists: false } }]));
    expect(await run(deleteFolderAi)({ folder_id: 'f' })).toEqual({ deleted: false, id: 'f' });
    await expect(run(deleteFolder)({ folder_id: 'f' })).rejects.toThrow(/404/);
  });
});

describe('passwords are used exactly as typed', () => {
  test('a password with surrounding spaces decrypts and is not trimmed', async () => {
    const enc = { ...PASTE, encrypted: true, content: CryptoJS.AES.encrypt('hi', ' secret ').toString(), title: '' };
    stubFetch(replies([{ body: enc }]));
    expect(await run(getPaste)({ paste_id: 'p', password: ' secret ' })).toMatchObject({ content: 'hi', decrypted: true });
    await expect(run(getPaste)({ paste_id: 'p', password: 'secret' })).rejects.toThrow(/Wrong Encryption Password/);
  });

  test('create encrypts with the untrimmed password', async () => {
    const seen = stubFetch(replies([{ body: { success: true, paste: { ...PASTE, encrypted: true, content: CryptoJS.AES.encrypt('x', ' pw ').toString(), title: '' } } }]));
    await run(createPaste)({ content: 'x', password: ' pw ' });
    const content = String(seen[0].body['content']);
    expect(CryptoJS.AES.decrypt(content, ' pw ').toString(CryptoJS.enc.Utf8)).toBe('x');
  });
});

describe('trigger', () => {
  test('a hash stored by the previous version does not fire for an unchanged paste', async () => {
    const data = new Map<string, unknown>();
    const store = { put: async (k: string, v: unknown) => data.set(k, v), get: async (k: string) => data.get(k) ?? null, delete: async (k: string) => data.delete(k) };
    const ctx = { auth: { props: { token: 'k' } }, propsValue: { paste_id: 'p', include_title: true }, store };
    data.set('paste_changed_trigger_hash', createHash('md5').update('c' + 'ab').digest('hex'));
    stubFetch(replies([{ body: { ...PASTE, title: 'ab', content: 'c' } }, { body: { ...PASTE, title: 'ab', content: 'c' } }, { body: { ...PASTE, title: 'ab', content: 'd' } }]));
    expect(await Reflect.apply(pasteChanged.run, pasteChanged, [ctx])).toEqual([]);
    expect(await Reflect.apply(pasteChanged.run, pasteChanged, [ctx])).toEqual([]);
    expect(await Reflect.apply(pasteChanged.run, pasteChanged, [ctx])).toHaveLength(1);
  });

  test('fires once per change and hashes content and title separately', async () => {
    const data = new Map<string, unknown>();
    const store = { put: async (k: string, v: unknown) => data.set(k, v), get: async (k: string) => data.get(k) ?? null, delete: async (k: string) => data.delete(k) };
    const ctx = { auth: { props: { token: 'k' } }, propsValue: { paste_id: 'p', include_title: true }, store };
    const replyList = [{ body: { ...PASTE, title: 'ab', content: 'c' } }, { body: { ...PASTE, title: 'ab', content: 'c' } }, { body: { ...PASTE, title: 'a', content: 'bc' } }];
    stubFetch(replies(replyList));
    await Reflect.apply(pasteChanged.onEnable, pasteChanged, [ctx]);
    expect(await Reflect.apply(pasteChanged.run, pasteChanged, [ctx])).toEqual([]);
    expect(await Reflect.apply(pasteChanged.run, pasteChanged, [ctx])).toHaveLength(1);
  });
});

test('tag list ignores blanks and duplicates', () => {
  expect(pastefyRequests.tagList(['a', '', ' a', 'b'])).toEqual(['a', 'b']);
});
