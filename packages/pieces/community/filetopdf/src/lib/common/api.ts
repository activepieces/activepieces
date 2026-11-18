import { HttpMethod } from '@activepieces/pieces-common';
import type { ApFile } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { filetopdfClient } from './client';
import type {
  FiletopdfAccount,
  FiletopdfAccountEnvelope,
  FiletopdfAuthValue,
  FiletopdfPdfEnvelope,
} from './types';

async function getAccount({ auth }: { auth: FiletopdfAuthValue }): Promise<FiletopdfAccount | undefined> {
  const envelope = await filetopdfClient.request<FiletopdfAccountEnvelope>({
    auth,
    method: HttpMethod.GET,
    path: '/account',
  });
  return envelope.data;
}

async function convertHtml({
  auth,
  html,
  css,
  options,
}: RenderParams & { auth: FiletopdfAuthValue; html: string }): Promise<FiletopdfPdfEnvelope> {
  const body: Record<string, unknown> = { html, ...options };
  if (css) body['css'] = css;
  return await filetopdfClient.request<FiletopdfPdfEnvelope>({
    auth,
    method: HttpMethod.POST,
    path: '/html',
    body,
  });
}

async function convertMarkdown({
  auth,
  markdown,
  css,
  options,
}: RenderParams & { auth: FiletopdfAuthValue; markdown: string }): Promise<FiletopdfPdfEnvelope> {
  const body: Record<string, unknown> = { markdown, ...options };
  if (css) body['css'] = css;
  return await filetopdfClient.request<FiletopdfPdfEnvelope>({
    auth,
    method: HttpMethod.POST,
    path: '/markdown',
    body,
  });
}

async function convertUploadedFile({
  auth,
  file,
  options,
}: {
  auth: FiletopdfAuthValue;
  file: ApFile;
  options: Record<string, string>;
}): Promise<FiletopdfPdfEnvelope> {
  const form = new FormData();
  form.append('files', Buffer.from(file.data), file.filename);
  for (const [key, value] of Object.entries(options)) {
    form.append(key, value);
  }
  return await filetopdfClient.request<FiletopdfPdfEnvelope>({
    auth,
    method: HttpMethod.POST,
    path: '/file',
    body: form,
    headers: form.getHeaders(),
  });
}

export const filetopdfApi = { getAccount, convertHtml, convertMarkdown, convertUploadedFile };

type RenderParams = {
  css: string | undefined;
  options: Record<string, string>;
};
