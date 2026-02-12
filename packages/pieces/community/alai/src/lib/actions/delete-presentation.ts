import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { alaiAuth } from '../common/auth';

export const deletePresentation = createAction({
  auth: alaiAuth,
  name: 'deletePresentation',
  displayName: 'Delete Presentation',
  description: 'Delete a presentation by its ID.',
  props: {
    presentationId: Property.ShortText({
      displayName: 'Presentation ID',
      description: 'The ID of the presentation to delete.',
      required: true,
    }),
  },
  async run(context) {
    const { presentationId } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://slides-api.getalai.com/api/v1/presentations/${presentationId}`,
      headers: {
        Authorization: `Bearer ${context.auth.props.apiKey}`,
      },
    });
    return response.body;
  },
});
