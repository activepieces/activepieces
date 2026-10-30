import { HttpMethod } from '@activepieces/pieces-common';
import mime from 'mime-types';
import {
  DEEPGRAM_TIMEOUTS,
  deepgramClient,
  LONG_AUDIO_HINT,
  QueryInput,
} from './client';
import { ListenResponse } from './transcript';

const CALLBACK_PORTS = ['', '80', '443', '8080', '8443'];

function fileBytes(file: unknown): Buffer | null {
  if (file === null || typeof file !== 'object') {
    return null;
  }
  const data = Reflect.get(file, 'data');
  if (Buffer.isBuffer(data)) {
    return data;
  }
  const base64 = Reflect.get(file, 'base64');
  return typeof base64 === 'string' && base64.length > 0
    ? Buffer.from(base64, 'base64')
    : null;
}

function fileContentType({
  file,
  fallback,
}: {
  file: unknown;
  fallback: string;
}): string {
  if (file === null || typeof file !== 'object') {
    return fallback;
  }
  const extension = Reflect.get(file, 'extension');
  const filename = Reflect.get(file, 'filename');
  const lookupKey =
    typeof extension === 'string' && extension.length > 0
      ? extension
      : typeof filename === 'string'
      ? filename
      : '';
  const type = lookupKey ? mime.lookup(lookupKey) : false;
  return type || fallback;
}

function checkPublicUrl({
  value,
  label,
}: {
  value: string;
  label: string;
}): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `${label} must be a full URL starting with https:// or http://.`
    );
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} must start with https:// or http://.`);
  }
  return value;
}

function resolveSource({
  audioUrl,
  audioFile,
  fallbackContentType,
}: {
  audioUrl: unknown;
  audioFile: unknown;
  fallbackContentType: string;
}): AudioSource {
  const url = typeof audioUrl === 'string' ? audioUrl.trim() : '';
  const hasFile =
    audioFile !== undefined && audioFile !== null && audioFile !== '';
  if (url.length > 0 && hasFile) {
    throw new Error('Provide either an audio URL or an audio file, not both.');
  }
  if (url.length > 0) {
    return {
      kind: 'url',
      url: checkPublicUrl({ value: url, label: 'Audio URL' }),
    };
  }
  if (!hasFile) {
    throw new Error('Provide an audio URL or an audio file to transcribe.');
  }
  const data = fileBytes(audioFile);
  if (!data || data.length === 0) {
    throw new Error('The audio file is empty or could not be read.');
  }
  return {
    kind: 'file',
    data,
    contentType: fileContentType({
      file: audioFile,
      fallback: fallbackContentType,
    }),
  };
}

function checkCallbackUrl(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(
      'Enter the callback URL that should receive the transcript.'
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(
      'The callback URL must be a full URL starting with https:// or http://.'
    );
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('The callback URL must start with https:// or http://.');
  }
  if (!CALLBACK_PORTS.includes(parsed.port)) {
    throw new Error(
      `Deepgram only calls back on ports 80, 443, 8080 or 8443, and this URL uses port ${parsed.port}.`
    );
  }
  return text;
}

async function listen({
  apiKey,
  source,
  query,
  operation,
}: {
  apiKey: string;
  source: AudioSource;
  query: QueryInput;
  operation: string;
}): Promise<ListenResponse> {
  const response = await deepgramClient.request<ListenResponse>({
    apiKey,
    method: HttpMethod.POST,
    path: '/listen',
    query,
    body:
      source.kind === 'url'
        ? { url: source.url }
        : deepgramClient.audioUploadBody(source.data),
    headers:
      source.kind === 'file'
        ? { 'Content-Type': source.contentType }
        : undefined,
    timeoutMs: DEEPGRAM_TIMEOUTS.listen,
    operation,
    timeoutHint: LONG_AUDIO_HINT,
  });
  return response.body ?? {};
}

function isEnglish(language: string | undefined | null): boolean {
  if (!language) {
    return true;
  }
  const lower = language.trim().toLowerCase();
  return lower === '' || lower === 'en' || lower.startsWith('en-');
}

export const deepgramAudio = {
  resolveSource,
  checkCallbackUrl,
  listen,
  isEnglish,
  fileBytes,
};

export type AudioSource =
  | { kind: 'url'; url: string }
  | { kind: 'file'; data: Buffer; contentType: string };
