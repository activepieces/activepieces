import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const getEmail = createAction({
  auth: lobstermailAuth,
  name: 'get_email',
  displayName: 'Get Email',
  description: 'Get a single email with full body content',
  props: {
    inbox_id: Property.ShortText({
      displayName: 'Inbox ID',
      description: 'The inbox ID',
      required: true,
    }),
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The email ID (e.g. eml_...)',
      required: true,
    }),
  },
  async run(context) {
    const { inbox_id, email_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${inbox_id}/emails/${email_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
