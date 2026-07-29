import { type InputPropertyMap, Property, tryCatch } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import type { PolotnoClient } from './client';
import {
  DEFAULT_MAX_TEMPLATE_RESULTS,
  DEFAULT_MAX_WAIT_SECONDS,
  MAX_TEMPLATE_RESULTS,
  TEMPLATE_PAGE_SIZE,
  TEXT_OVERFLOW_MODES,
} from './constants';
import { createClient } from './client';
import type { FieldDef, TemplateSummary } from './types';

export function fieldsToProps(fields: FieldDef[]): InputPropertyMap {
  const props: InputPropertyMap = {};
  for (const field of fields) {
    const base = {
      displayName: field.label,
      required: field.required,
      ...(field.help_text === undefined ? {} : { description: field.help_text }),
    };
    switch (field.type) {
      case 'integer':
        props[field.key] = Property.Number({
          ...base,
          ...(typeof field.default === 'number' ? { defaultValue: field.default } : {}),
        });
        break;
      case 'boolean':
        props[field.key] = Property.Checkbox({
          ...base,
          ...(typeof field.default === 'boolean' ? { defaultValue: field.default } : {}),
        });
        break;
      case 'color':
        props[field.key] = Property.Color({
          ...base,
          ...(typeof field.default === 'string' ? { defaultValue: field.default } : {}),
        });
        break;
      default:
        props[field.key] = Property.ShortText({
          ...base,
          ...(typeof field.default === 'string' ? { defaultValue: field.default } : {}),
        });
        break;
    }
  }
  return props;
}

export interface TemplateFilters {
  name?: string;
  tag?: string;
  archived?: boolean;
  maxResults?: number;
}

export interface FetchAllTemplatesParams {
  client: PolotnoClient;
  filters?: TemplateFilters;
}

export async function fetchAllTemplates({
  client,
  filters = {},
}: FetchAllTemplatesParams): Promise<TemplateSummary[]> {
  const limit = Math.max(
    1,
    Math.min(filters.maxResults ?? DEFAULT_MAX_TEMPLATE_RESULTS, MAX_TEMPLATE_RESULTS),
  );
  const items: TemplateSummary[] = [];
  let cursor: string | undefined;

  do {
    const queryParams: Record<string, string> = {
      omit_design: 'true',
      limit: String(Math.min(TEMPLATE_PAGE_SIZE, limit - items.length)),
    };
    if (filters.name) queryParams['name'] = filters.name;
    if (filters.tag) queryParams['tag'] = filters.tag;
    if (filters.archived === true) queryParams['archived'] = 'true';
    if (cursor) queryParams['cursor'] = cursor;

    const page = await client.request<{ items: TemplateSummary[]; next_cursor?: string | null }>({
      path: '/v1/templates',
      queryParams,
    });
    items.push(...page.items);
    cursor = page.next_cursor ?? undefined;
  } while (cursor && items.length < limit);

  return items.slice(0, limit);
}

export const templateIdProp = Property.Dropdown({
  auth: polotnoStudioAuth,
  displayName: 'Template',
  description: 'The Polotno Studio template to render.',
  required: true,
  refreshers: ['auth'],
  refreshOnSearch: true,
  options: async ({ auth }, ctx) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Polotno Studio account first' };
    }
    const { data: templates, error } = await tryCatch(() => {
      const client = createClient({ apiKey: auth.secret_text });
      return fetchAllTemplates({
        client,
        filters: {
          maxResults: MAX_TEMPLATE_RESULTS,
          ...(ctx.searchValue ? { name: ctx.searchValue } : {}),
        },
      });
    });
    if (error) {
      return {
        disabled: true,
        options: [],
        placeholder: error instanceof Error ? error.message : 'Failed to load templates',
      };
    }
    if (templates.length === 0) {
      return { options: [], placeholder: 'No templates found in this project' };
    }
    return { options: templates.map((t) => ({ label: t.name, value: t.id })) };
  },
});

export const dynamicFieldsProp = Property.DynamicProperties({
  auth: polotnoStudioAuth,
  displayName: 'Template Fields',
  description: 'Values for the editable fields defined on the selected template.',
  required: false,
  refreshers: ['template_id'],
  props: async ({ auth, template_id }) => {
    if (!auth || !template_id) return {};
    const client = createClient({ apiKey: auth.secret_text });
    const response = await client.request<{ fields: FieldDef[] }>({
      path: `/v1/templates/${encodeURIComponent(String(template_id))}/dynamic-fields`,
    });
    return fieldsToProps(response.fields ?? []);
  },
});

export const waitForCompletionProp = Property.Checkbox({
  displayName: 'Wait for Completion',
  description:
    'Pause the flow until the render finishes, then continue with the finished render. Turn this off to continue immediately with a pending render.',
  required: false,
  defaultValue: true,
});

export const maxWaitSecondsProp = Property.Number({
  displayName: 'Max Wait (seconds)',
  description:
    'Only used when this Activepieces instance is not reachable at a public https address, in which case the render is polled instead of waited on. Keep it well below your instance flow timeout.',
  required: false,
  defaultValue: DEFAULT_MAX_WAIT_SECONDS,
});

export const metadataProp = Property.Object({
  displayName: 'Metadata',
  description: 'Arbitrary key/value data stored on the render and echoed back in webhooks.',
  required: false,
});

export const textOverflowProp = Property.StaticDropdown<string>({
  displayName: 'Text Overflow',
  description: 'How text that does not fit its box is handled.',
  required: false,
  options: {
    options: TEXT_OVERFLOW_MODES.map((mode) => ({
      label: mode.charAt(0).toUpperCase() + mode.slice(1),
      value: mode,
    })),
  },
});
