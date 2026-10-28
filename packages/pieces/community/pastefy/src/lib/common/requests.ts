import { HttpMethod } from '@activepieces/pieces-common';
import CryptoJS from 'crypto-js';
import { PastefyAuthValue, pastefyClient } from './client';

export const pastefyRequests = { getPaste, createPaste, editPaste, deleteItem, createFolder, getFolder, folderTree, subtree, flattenTree, listPastes, formatExpiry, tagList, decryptPaste, encrypt };

async function getPaste({ auth, pasteId, password }: { auth: PastefyAuthValue; pasteId: string; password?: string }): Promise<PasteOutput> {
  const body = await pastefyClient.request({
    auth,
    method: HttpMethod.GET,
    path: `/paste/${pastefyClient.seg({ value: pasteId, label: 'Paste ID' })}`,
    allowAnonymous: true,
  });
  return decryptPaste({ paste: asRecord(body), password });
}

async function createPaste({ auth, input }: { auth: PastefyAuthValue; input: PasteInput }): Promise<PasteOutput> {
  if (!input.content) {
    throw new Error('Content is required.');
  }
  const password = passwordOf(input.password);
  const title = cleanText(input.title);
  const requestedFolder = cleanText(input.folderId);
  if (requestedFolder) {
    await getFolder({ auth, folderId: requestedFolder, includeContents: false });
  }
  const body = await pastefyClient.request({
    auth,
    method: HttpMethod.POST,
    path: '/paste',
    allowAnonymous: true,
    body: {
      content: password ? encrypt({ text: input.content, password }) : input.content,
      ...(title ? { title: password ? encrypt({ text: title, password }) : title } : {}),
      encrypted: password !== undefined,
      ...(requestedFolder ? { folder: requestedFolder } : {}),
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(input.expiry ? { expire_at: formatExpiry(input.expiry) } : {}),
      ...(tagList(input.tags).length > 0 ? { tags: tagList(input.tags) } : {}),
    },
  });
  const paste = asRecord(pastefyClient.isRecord(body) ? body['paste'] : undefined);
  if (requestedFolder && paste['folder'] !== requestedFolder) {
    throw new Error(`The paste ${String(paste['id'])} was created, but Pastefy did not put it in folder ${requestedFolder} (the folder does not exist or belongs to another account).`);
  }
  return decryptPaste({ paste, password });
}

async function editPaste({ auth, pasteId, input }: { auth: PastefyAuthValue; pasteId: string; input: PasteEditInput }): Promise<PasteOutput> {
  pastefyClient.requireToken({ auth });
  const password = passwordOf(input.password);
  const current = await getPaste({ auth, pasteId, password: undefined });
  const wasEncrypted = current.encrypted === true;
  const changesText = input.content !== undefined && input.content !== '' || cleanText(input.title) !== undefined;
  if (wasEncrypted && changesText && !password) {
    throw new Error('This paste is encrypted. Give the Encryption Password to change its content or title, or the stored text would no longer decrypt.');
  }
  if (wasEncrypted && password) {
    decryptPaste({ paste: current, password });
  }
  if (!wasEncrypted && password && !input.content) {
    throw new Error('To encrypt a paste that is not encrypted yet, give its Content too.');
  }
  const title = cleanText(input.title) ?? (!wasEncrypted && password && typeof current.title === 'string' && current.title ? current.title : undefined);
  const tags = tagList(input.tags);
  const update = {
    ...(input.content ? { content: password ? encrypt({ text: input.content, password }) : input.content } : {}),
    ...(title ? { title: password ? encrypt({ text: title, password }) : title } : {}),
    ...(password ? { encrypted: true } : {}),
    ...(cleanText(input.folderId) ? { folder: cleanText(input.folderId) } : {}),
    ...(input.visibility ? { visibility: input.visibility } : {}),
    ...(input.expiry ? { expire_at: formatExpiry(input.expiry) } : {}),
    ...(tags.length > 0 ? { tags } : input.clearTags === true ? { tags: [] } : {}),
  };
  if (Object.keys(update).length === 0) {
    throw new Error('Nothing to update: give at least one field to change.');
  }
  await pastefyClient.request({
    auth,
    method: HttpMethod.PUT,
    path: `/paste/${pastefyClient.seg({ value: pasteId, label: 'Paste ID' })}`,
    body: update,
  });
  return getPaste({ auth, pasteId, password });
}

async function deleteItem({ auth, kind, id, missingIsOk }: { auth: PastefyAuthValue; kind: 'paste' | 'folder'; id: string | undefined; missingIsOk: boolean }): Promise<DeleteOutput> {
  const label = kind === 'paste' ? 'Paste ID' : 'Folder ID';
  const path = `/${kind}/${pastefyClient.seg({ value: id, label })}`;
  if (kind === 'folder') {
    const response = await pastefyClient.send({ auth, method: HttpMethod.GET, path });
    if (response.status === 404 || (pastefyClient.isRecord(response.body) && response.body['exists'] === false)) {
      if (missingIsOk) return { deleted: false, id: id ?? '' };
      throw pastefyClient.toApiError({ status: 404, responseBody: response.body });
    }
  }
  try {
    await pastefyClient.request({ auth, method: HttpMethod.DELETE, path });
    return { deleted: true, id: id ?? '' };
  } catch (error) {
    if (missingIsOk && pastefyClient.statusOf(error) === 404) {
      return { deleted: false, id: id ?? '' };
    }
    throw error;
  }
}

async function createFolder({ auth, name, parentId }: { auth: PastefyAuthValue; name: string; parentId?: string }): Promise<Record<string, unknown>> {
  const cleanName = cleanText(name);
  if (!cleanName) {
    throw new Error('Name is required.');
  }
  const parent = cleanText(parentId);
  if (parent) {
    await getFolder({ auth, folderId: parent, includeContents: false });
  }
  const body = await pastefyClient.request({
    auth,
    method: HttpMethod.POST,
    path: '/folder',
    body: { name: cleanName, ...(parent ? { parent } : {}) },
  });
  return asRecord(pastefyClient.isRecord(body) ? body['folder'] : undefined);
}

async function getFolder({ auth, folderId, includeContents }: { auth: PastefyAuthValue; folderId: string | undefined; includeContents: boolean }): Promise<Record<string, unknown>> {
  const body = await pastefyClient.request({
    auth,
    method: HttpMethod.GET,
    path: `/folder/${pastefyClient.seg({ value: folderId, label: 'Folder ID' })}`,
    query: { hide_children: includeContents ? undefined : 'true' },
  });
  const folder = asRecord(body);
  if (folder['exists'] === false) {
    throw pastefyClient.toApiError({ status: 404, responseBody: body });
  }
  return folder;
}

async function folderTree({ auth }: { auth: PastefyAuthValue }): Promise<FolderNode[]> {
  const body = await pastefyClient.request({
    auth,
    method: HttpMethod.GET,
    path: '/user/folders',
    query: { hide_pastes: 'true' },
  });
  return Array.isArray(body) ? body.map(toNode) : [];
}

function subtree({ tree, folderId }: { tree: FolderNode[]; folderId: string }): FolderNode[] | null {
  for (const node of tree) {
    if (node.id === folderId) return node.children;
    const found = subtree({ tree: node.children, folderId });
    if (found) return found;
  }
  return null;
}

function flattenTree({ tree, parentPath, parentId }: { tree: FolderNode[]; parentPath: string; parentId: string | null }): FlatFolder[] {
  return tree.flatMap((node) => {
    const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
    return [{ id: node.id, name: node.name, path, parent_id: parentId }, ...flattenTree({ tree: node.children, parentPath: path, parentId: node.id })];
  });
}

async function listPastes({ auth, source, search, folderId, tags, page, pageLimit, shortenContent }: ListPastesInput): Promise<PasteListOutput> {
  const currentPage = pastefyClient.wholeNumber({ value: page, label: 'Page', min: 1, max: 100000, fallback: 1 });
  const limit = pastefyClient.wholeNumber({ value: pageLimit, label: 'Page Size', min: 1, max: 50, fallback: 20 });
  const path = source === 'mine' ? '/user/pastes' : source === 'latest' ? '/public-pastes/latest' : source === 'trending' ? '/public-pastes/trending' : '/public-pastes';
  const tagFilter = tagList(tags);
  const body = await pastefyClient.request({
    auth,
    method: HttpMethod.GET,
    path,
    allowAnonymous: source !== 'mine',
    query: {
      page: currentPage,
      page_limit: limit,
      search: cleanText(search),
      'filter[folder]': cleanText(folderId),
      filter_tags: tagFilter.length > 0 ? tagFilter.join(',') : undefined,
      shorten_content: shortenContent === false ? 'false' : 'true',
    },
  });
  const pastes = Array.isArray(body) ? body.map(asRecord) : [];
  return { pastes, page: currentPage, page_limit: limit, count: pastes.length, has_more: pastes.length === limit };
}

function formatExpiry(value: string): string {
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Expiry Date "${value}" is not a valid date.`);
  }
  if (date.getTime() <= Date.now()) {
    throw new Error('Expiry Date must be in the future.');
  }
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

function tagList(tags: unknown): string[] {
  const raw = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : [];
  return [...new Set(raw.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter((tag) => tag !== ''))];
}

function decryptPaste({ paste, password }: { paste: Record<string, unknown>; password?: string }): PasteOutput {
  const secret = passwordOf(password);
  if (paste['encrypted'] !== true || !secret) {
    return { ...paste, decrypted: false };
  }
  const content = decrypt({ text: paste['content'], password: secret });
  if (content === null) {
    throw new Error('Wrong Encryption Password: the paste content could not be decrypted.');
  }
  const title = typeof paste['title'] === 'string' && paste['title'] ? decrypt({ text: paste['title'], password: secret }) : paste['title'];
  return { ...paste, content, title: title ?? paste['title'], decrypted: true };
}

function encrypt({ text, password }: { text: string; password: string }): string {
  return CryptoJS.AES.encrypt(text, password).toString();
}

function decrypt({ text, password }: { text: unknown; password: string }): string | null {
  if (typeof text !== 'string' || text === '') return null;
  try {
    const plain = CryptoJS.AES.decrypt(text, password).toString(CryptoJS.enc.Utf8);
    return plain === '' ? null : plain;
  } catch {
    return null;
  }
}

function passwordOf(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function cleanText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return pastefyClient.isRecord(value) ? value : {};
}

function toNode(value: unknown): FolderNode {
  const record = asRecord(value);
  return {
    id: String(record['id'] ?? ''),
    name: String(record['name'] ?? ''),
    children: Array.isArray(record['children']) ? record['children'].map(toNode) : [],
  };
}

export type PasteInput = { content: string; title?: string; password?: string; folderId?: string; visibility?: string; expiry?: string; tags?: unknown };
export type PasteEditInput = { content?: string; title?: string; password?: string; folderId?: string; visibility?: string; expiry?: string; tags?: unknown; clearTags?: boolean };
export type PasteOutput = Record<string, unknown> & { decrypted: boolean };
export type DeleteOutput = { deleted: boolean; id: string };
export type FolderNode = { id: string; name: string; children: FolderNode[] };
export type FlatFolder = { id: string; name: string; path: string; parent_id: string | null };
export type PasteListOutput = { pastes: Record<string, unknown>[]; page: number; page_limit: number; count: number; has_more: boolean };
export type ListPastesInput = {
  auth: PastefyAuthValue;
  source: 'mine' | 'public' | 'latest' | 'trending';
  search?: string;
  folderId?: string;
  tags?: unknown;
  page?: unknown;
  pageLimit?: unknown;
  shortenContent?: boolean;
};
