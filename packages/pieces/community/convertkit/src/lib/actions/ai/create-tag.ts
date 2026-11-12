import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { Tag } from '../../common/types';
import { kitCreateTagOutputSchema } from '../../output-schemas';

export const kitCreateTag = createAction({
  auth: convertkitAuth,
  name: 'kit_create_tag',
  classification: 'WRITE',
  outputSchema: kitCreateTagOutputSchema,
  displayName: 'Create Tag',
  description: 'Create a tag, or return the existing tag with the same name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets or creates a tag by name: if a tag with the same name exists (case-insensitive) it is returned with created false, otherwise a new tag is created with created true. Safe to retry.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The tag name.',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name.trim();
    if (!name) {
      throw new Error('Tag name cannot be empty.');
    }
    const existing = await kitClient.request<{ tags: Tag[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/tags',
    });
    const match = (existing.body.tags ?? []).find(
      (tag) => tag.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (match) {
      return { ...match, created: false };
    }
    const response = await kitClient.request<Tag>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/tags',
      body: { tag: { name } },
    });
    return { ...response.body, created: true };
  },
});
