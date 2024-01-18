import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../index';
import { beamerCommon } from '../common';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const createComment = createAction({
  auth: beamerAuth,
  name: 'create_new_comment',
  displayName: 'Create a new comment',
  description: 'Create a new comment for a Feature request',
  props: {
    featureRequestId: Property.Number({
      displayName: 'ID',
      description: 'ID of the feature request',
      required: true,
    }),
    userId: Property.Number({
      displayName: 'User ID',
      description: 'id of the user making the comment',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Content of your comment',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'Feature requested by..',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${beamerCommon.baseUrl}/requests/${context.propsValue.featureRequestId}/comments`,
      headers: {
        'Beamer-Api-Key': `${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        text: context.propsValue.text,
        userId: context.propsValue.userId,
        userEmail: context.propsValue.userEmail,
        visible: 'true',
      },
    };
    const res = await httpClient.sendRequest<any>(request);
    return res.body;
  },
});
