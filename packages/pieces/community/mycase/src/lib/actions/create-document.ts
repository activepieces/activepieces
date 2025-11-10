import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createDocumentAction = createAction({
  auth: mycaseAuth,
  name: 'create_document',
  displayName: 'Create Document',
  description: 'Creates a new document',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createDocument({ title: context.propsValue.title });
  },
});

