import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const listTemplates = createAction({
  auth: mailchimpAuth,
  name: 'list_templates',
  classification: 'SEARCH',
  displayName: 'List Templates',
  description: 'List email templates in your account.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists email templates one page at a time with ID, name, type and dates. Type "user" (default) is your saved templates, "base" and "gallery" are Mailchimp stock templates. Use the numeric ID as template_id in Set Campaign Content. Check has_more for more pages. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['templates'],
  props: {
    type: Property.StaticDropdown<string>({
      displayName: 'Type',
      required: false,
      defaultValue: 'user',
      options: {
        disabled: false,
        options: [
          { label: 'My Templates', value: 'user' },
          { label: 'Basic', value: 'base' },
          { label: 'Gallery', value: 'gallery' },
        ],
      },
    }),
    count: Property.Number({
      displayName: 'Limit',
      description: 'How many records to return (1-1000). Default 100.',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many records to skip, for paging. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const paging = mailchimpApi.readPaging({ count: context.propsValue.count, offset: context.propsValue.offset, defaultCount: 100 });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<TemplatesResponse>({
      method: HttpMethod.GET,
      path: '/templates',
      queryParams: {
        count: paging.count,
        offset: paging.offset,
        type: mailchimpApi.optionalText(context.propsValue.type),
      },
      operation: 'list templates',
    });
    const templates = body.templates.map((template) => ({
      id: template.id,
      name: template.name,
      type: template.type,
      category: template.category ?? null,
      active: template.active ?? true,
      date_created: template.date_created ?? null,
      date_edited: template.date_edited ?? null,
      thumbnail: template.thumbnail || null,
    }));
    return {
      templates,
      total_items: body.total_items,
      has_more: paging.offset + templates.length < body.total_items,
    };
  },
});

type TemplatesResponse = {
  templates: {
    id: number;
    name: string;
    type: string;
    category?: string;
    active?: boolean;
    date_created?: string;
    date_edited?: string;
    thumbnail?: string;
  }[];
  total_items: number;
};
