import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pendoAuth } from '../auth';
import { pendoRequest } from '../common/client';

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
    return await pendoRequest(
      String(context.auth),
      HttpMethod.GET,
      `/visitor/${encodeURIComponent(visitorId)}`,
    );
  },
});
