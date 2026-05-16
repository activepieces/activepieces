import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';

export const getVisitor = createAction({
  auth: pendoAuth,
  name: 'get_visitor',
  displayName: 'Get Visitor Details',
  description: 'Retrieve details of a visitor by their ID.',
  props: {
    visitorId: Property.ShortText({
      displayName: 'Visitor ID',
      description: 'The unique identifier for the visitor.',
      required: true,
    }),
  },
  async run(context) {
    const { visitorId } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://app.pendo.io/api/v1/visitor/${encodeURIComponent(
        visitorId
      )}`,
      headers: {
        'x-pendo-integration-key': context.auth.secret_text,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
