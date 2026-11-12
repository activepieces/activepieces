import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { isRecord, klaviyoApi } from '../common/client';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const createList = createAction({
  auth: klaviyoAuth,
  name: 'createList',
  classification: 'WRITE',
  displayName: 'Create List',
  description: 'Create a new subscriber list.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new, empty subscriber list in Klaviyo with the given name. Use when you need a fresh list to group profiles into; to find an existing list use Find List by Name or List Lists. Requires a non-empty name; not idempotent, so each call creates another list even if the name matches an existing one.',
    idempotent: false,
  },
  outputSchema: klaviyoOutputSchemas.createList,
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name for the new list',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const name = (propsValue.name ?? '').trim();
    if (name.length === 0) {
      throw new Error('List name cannot be empty');
    }
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/lists',
      body: { data: { type: 'list', attributes: { name } } },
    });
    return {
      success: true,
      message: `List "${name}" created successfully`,
      list: isRecord(response.body) ? response.body['data'] : undefined,
    };
  },
});
