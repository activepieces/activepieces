import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { optionalInt } from './shared-props';

function records({ body, key }: { body: unknown; key: string }): Record<string, unknown>[] {
  const list: unknown = typeof body === 'object' && body !== null ? Reflect.get(body, key) : undefined;
  if (!Array.isArray(list)) {
    throw new Error(`Alai returned an unexpected response: "${key}" is missing.`);
  }
  return list.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}

const text = (value: unknown): string => (typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value));

export const listPresentations = createAction({
  auth: alaiAuth,
  name: 'listPresentations',
  classification: 'SEARCH',
  displayName: 'List Presentations',
  description: 'List your presentations, newest first, optionally filtered by title.',
  audience: 'both',
  outputSchema: alaiOutputSchemas.listPresentations,
  aiMetadata: {
    description:
      'Lists the Alai presentations of the connected user, newest first, as id and title. Optional titleContains filters case-insensitively; limit caps the result (default 100) and total/truncated say how many matched. Use it to find a presentation ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    titleContains: Property.ShortText({
      displayName: 'Title Contains',
      description: 'Only titles containing this text (not case-sensitive).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of presentations to return (default 100).',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = optionalInt({ value: propsValue.limit, label: 'Limit', min: 1 }) ?? 100;
    const filter = propsValue.titleContains?.trim().toLowerCase();
    const body = await alaiClient.request<unknown>({ apiKey: auth.props.apiKey, method: HttpMethod.GET, path: '/presentations' });
    const all = records({ body, key: 'presentations' })
      .map((item) => ({ id: text(item['id']), title: text(item['title']) }))
      .filter((item) => !filter || item.title.toLowerCase().includes(filter));
    const presentations = all.slice(0, limit);
    return { presentations, count: presentations.length, total: all.length, truncated: all.length > presentations.length };
  },
});

export const listThemes = createAction({
  auth: alaiAuth,
  name: 'listThemes',
  classification: 'SEARCH',
  displayName: 'List Themes',
  description: 'List the themes you can use when generating a presentation.',
  audience: 'both',
  outputSchema: alaiOutputSchemas.listThemes,
  aiMetadata: {
    description:
      'Lists the Alai themes available to the connected user (id and name). Pass a theme id as themeId to Generate Presentation. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const body = await alaiClient.request<unknown>({ apiKey: auth.props.apiKey, method: HttpMethod.GET, path: '/themes' });
    const themes = records({ body, key: 'themes' }).map((item) => ({ id: text(item['id']), name: text(item['name']) }));
    return { themes, count: themes.length };
  },
});

export const listVibes = createAction({
  auth: alaiAuth,
  name: 'listVibes',
  classification: 'SEARCH',
  displayName: 'List Vibes',
  description: 'List the vibes (visual styles) you can use when generating a presentation.',
  audience: 'both',
  outputSchema: alaiOutputSchemas.listVibes,
  aiMetadata: {
    description:
      'Lists the Alai vibes (visual style presets) available to the connected user (id, name, source). Pass a vibe id as vibeId to Generate Presentation. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const body = await alaiClient.request<unknown>({ apiKey: auth.props.apiKey, method: HttpMethod.GET, path: '/vibes' });
    const vibes = records({ body, key: 'vibes' }).map((item) => ({ id: text(item['id']), name: text(item['name']), source: text(item['source']) }));
    return { vibes, count: vibes.length };
  },
});
