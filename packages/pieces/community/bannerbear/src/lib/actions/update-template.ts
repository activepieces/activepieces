import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient, RawTemplate } from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const updateTemplateAction = createAction({
  auth: bannerbearAuth,
  name: 'update_template',
  classification: 'WRITE',
  displayName: 'Update Template',
  description: 'Rename a template or change its tags.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update a Bannerbear template name, tags, or metadata (V2) / description (V5). Fields left empty are not changed; tags replace the full list. Setting the same values again changes nothing.',
    idempotent: true,
  },
  outputSchema: bannerbearOutputSchemas['template'],
  props: {
    template_uid: Property.ShortText({
      displayName: 'Template ID',
      description: 'The template UID, from List Templates.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New template name.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces all tags. Leave empty to keep current tags.',
      required: false,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata (V2 keys only)',
      description: 'Text stored with the template.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description (V5 keys only)',
      description: 'Template description.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const uid = propsValue.template_uid.trim();
    if (uid === '') throw new Error('Template ID is required.');
    const body: Record<string, unknown> = {};
    if (propsValue.name !== undefined && propsValue.name !== '') {
      body['name'] = propsValue.name;
    }
    if (Array.isArray(propsValue.tags) && propsValue.tags.length > 0) {
      body['tags'] = propsValue.tags.map((t) => String(t));
    }
    if (propsValue.metadata !== undefined && propsValue.metadata !== '') {
      bannerbearClient.requireVersion({ apiKey, version: 'v2', feature: 'Template metadata' });
      body['metadata'] = propsValue.metadata;
    }
    if (propsValue.description !== undefined && propsValue.description !== '') {
      bannerbearClient.requireVersion({ apiKey, version: 'v5', feature: 'Template description' });
      body['description'] = propsValue.description;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const raw = await bannerbearClient.request<RawTemplate>({
      apiKey,
      method: HttpMethod.PATCH,
      path: bannerbearClient.templatePath({ apiKey, uid }),
      body,
    });
    return bannerbearClient.normalizeTemplate(raw);
  },
});
