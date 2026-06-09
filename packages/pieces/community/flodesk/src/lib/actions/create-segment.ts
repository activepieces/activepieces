import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall } from '../common';

export const createSegmentAction = createAction({
  auth: flodeskAuth,
  name: 'create_segment',
  displayName: 'Create Segment',
  description: 'Create a new segment in Flodesk.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'The name of the segment to create.',
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const response = await flodeskApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/segments',
      body: {
        name: props.name,
      },
    });

    return response;
  },
});
