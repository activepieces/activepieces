import { ApFile, DropdownState, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { syncmateAuth } from '../auth';
import { describeError, syncmateRequest } from './client';
import { fileNameFromUrl, MediaItem, mediaFromArray, rawBase64 } from './payload';

type Listed = Record<string, unknown>;

/** `data` as a list, or the list under one of `keys` inside it. */
export function listFrom(response: unknown, keys: string[]): Listed[] {
  const data = (response as { data?: unknown } | null)?.data ?? response;
  if (Array.isArray(data)) return data as Listed[];
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as Listed[];
    }
  }
  return [];
}

/** A WhatsApp id that may be a string or `{ _serialized }`. */
export function waId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const serialized = (value as Record<string, unknown>)['_serialized'];
    if (typeof serialized === 'string') return serialized;
  }
  return '';
}

export function groupOptions(response: unknown): { label: string; value: string }[] {
  return listFrom(response, ['groups', 'groups '])
    .map((g) => {
      const id = waId(g['id'] ?? g['jid'] ?? g['groupId']);
      const name = String(g['subject'] ?? g['name'] ?? id);
      return { label: name, value: id };
    })
    .filter((o) => o.value !== '')
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function channelOptions(response: unknown): { label: string; value: string }[] {
  return listFrom(response, ['channels', 'newsletters'])
    .map((c) => {
      const id = waId(c['id'] ?? c['jid'] ?? c['newsletterId']);
      const name = String(c['name'] ?? c['subject'] ?? c['title'] ?? id);
      return { label: name, value: id };
    })
    .filter((o) => o.value !== '')
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function templateOptions(response: unknown): { label: string; value: string }[] {
  const seen = new Set<string>();
  const options: { label: string; value: string }[] = [];
  for (const t of listFrom(response, ['templates'])) {
    const name = String(t['name'] ?? '').trim();
    if (name === '' || seen.has(name)) continue;
    seen.add(name);
    const details = [t['language'], t['status'], t['category']].filter(Boolean).join(' · ');
    options.push({ label: details ? `${name} (${details})` : name, value: name });
  }
  return options.sort((a, b) => a.value.localeCompare(b.value));
}

export function connectionOptions(response: unknown): { label: string; value: number }[] {
  return listFrom(response, ['connections'])
    .map((c) => ({
      label: `${String(c['name'] ?? c['id'])}${c['mode'] === 'meta' ? ' · Meta' : ''}${c['connected'] === false ? ' · not connected' : ''}`,
      value: Number(c['id']),
    }))
    .filter((o) => Number.isFinite(o.value) && o.value > 0);
}

function notConnected<T>(): DropdownState<T> {
  return { disabled: true, options: [], placeholder: 'Connect your SyncMate account first' };
}

function failed<T>(e: unknown): DropdownState<T> {
  return { disabled: true, options: [], placeholder: describeError(e) };
}

export const syncmateProps = {
  phone: (displayName = 'Phone Number') =>
    Property.ShortText({
      displayName,
      description: 'With country code, e.g. +919876543210. Spaces and dashes are removed.',
      required: true,
    }),

  message: (required: boolean) =>
    Property.LongText({
      displayName: 'Message',
      description: required ? 'The text to send.' : 'The text to send. Optional when you attach a file.',
      required,
    }),

  group: Property.Dropdown<string, false, typeof syncmateAuth>({
    auth: syncmateAuth,
    displayName: 'Group',
    description: 'Pick a group of the connected number, or type its ID in "Group ID" below.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      try {
        const options = groupOptions(await syncmateRequest({ auth, method: HttpMethod.GET, path: '/groups' }));
        return options.length
          ? { disabled: false, options }
          : { disabled: true, options: [], placeholder: 'No groups yet. Groups sync a few minutes after connecting.' };
      } catch (e) {
        return failed(e);
      }
    },
  }),

  channel: Property.Dropdown<string, false, typeof syncmateAuth>({
    auth: syncmateAuth,
    displayName: 'Channel',
    description: 'Pick a channel the connected number administers, or type its ID in "Channel ID" below.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      try {
        const options = channelOptions(await syncmateRequest({ auth, method: HttpMethod.GET, path: '/channels' }));
        return options.length
          ? { disabled: false, options }
          : { disabled: true, options: [], placeholder: 'No channels found for this number.' };
      } catch (e) {
        return failed(e);
      }
    },
  }),

  template: Property.Dropdown<string, true, typeof syncmateAuth>({
    auth: syncmateAuth,
    displayName: 'Template',
    description: 'An approved message template of your Meta Cloud API number.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      try {
        const options = templateOptions(
          await syncmateRequest({ auth, method: HttpMethod.GET, path: '/v1/meta/templates', queryParams: { limit: '500' } })
        );
        return options.length
          ? { disabled: false, options }
          : { disabled: true, options: [], placeholder: 'No templates found. Create one in SyncMate first.' };
      } catch (e) {
        return failed(e);
      }
    },
  }),

  connection: Property.Dropdown<number, false, typeof syncmateAuth>({
    auth: syncmateAuth,
    displayName: 'WhatsApp Number',
    description: 'Only events of this number start the flow. Leave empty for all numbers of your account.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      try {
        const options = connectionOptions(
          await syncmateRequest({ auth, method: HttpMethod.GET, path: '/v1/activepieces/events/connections' })
        );
        return options.length
          ? { disabled: false, options }
          : { disabled: true, options: [], placeholder: 'No WhatsApp numbers found on your account.' };
      } catch (e) {
        return failed(e);
      }
    },
  }),

  attachments: {
    file: Property.File({
      displayName: 'File',
      description: 'A file from an earlier step (image, video, audio or document).',
      required: false,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'A public link to a file. SyncMate downloads it and sends it as an attachment.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name shown to the recipient, e.g. invoice.pdf. Defaults to the file\'s own name.',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media Attachments (base64)',
      description: 'Advanced: files already encoded as base64.',
      required: false,
      properties: {
        media_base64: Property.LongText({ displayName: 'Media Base64', required: true }),
        file_name: Property.ShortText({ displayName: 'File Name', description: 'e.g. image.jpg', required: true }),
      },
    }),
  },
};

/** Every attachment the user gave, in one list: file, then URL, then base64 rows. */
export async function collectMedia(input: {
  file?: ApFile | null;
  fileUrl?: string | null;
  fileName?: string | null;
  media?: unknown;
}): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  const name = String(input.fileName ?? '').trim();

  if (input.file) {
    items.push({
      media_base64: input.file.base64,
      file_name: name || input.file.filename || `file${input.file.extension ? `.${input.file.extension}` : ''}`,
    });
  }

  const url = String(input.fileUrl ?? '').trim();
  if (url !== '') {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('File URL must be a public http(s) link.');
    }
    let data: ArrayBuffer | Buffer;
    try {
      const response = await httpClient.sendRequest<ArrayBuffer>({
        method: HttpMethod.GET,
        url,
        responseType: 'arraybuffer',
      });
      data = response.body;
    } catch (e) {
      throw new Error(`Could not download the file from File URL: ${describeError(e)}`);
    }
    items.push({
      media_base64: rawBase64(Buffer.from(data as ArrayBuffer).toString('base64')),
      file_name: (input.file ? '' : name) || fileNameFromUrl(url),
    });
  }

  return [...items, ...mediaFromArray(input.media)];
}
