import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createSpace = createAction({
  auth: PaperformAuth,
  name: 'createSpace',
  displayName: 'Create Space',
  description: 'Create a new space in Paperform',
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the space',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color code for the space (e.g., #FF5733)',
      required: false,
    }),
  },
  async run(context) {
    const { name, description, color } = context.propsValue;
    const apiKey = context.auth as string;

    const spaceData: any = {
      name,
    };

    // Add optional fields if provided
    if (description) {
      spaceData.description = description;
    }

    if (color) {
      spaceData.color = color;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/spaces',
      spaceData
    );

    return {
      success: true,
      message: `Successfully created space "${name}"`,
      space: response.results.space,
    };
  },
});
