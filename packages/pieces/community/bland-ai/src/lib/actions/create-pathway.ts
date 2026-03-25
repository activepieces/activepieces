import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const createPathway = createAction({
  auth: blandAiAuth,
  name: 'create_pathway',
  displayName: 'Create Pathway',
  description:
    'Create a new conversational pathway for structuring AI call flows.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the conversational pathway.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the conversational pathway.',
      required: false,
    }),
  },
  async run(context) {
    const { name, description } = context.propsValue;

    const body: Record<string, unknown> = {
      name,
    };

    if (description) body['description'] = description;

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/pathway/create',
      body,
    });
  },
});
