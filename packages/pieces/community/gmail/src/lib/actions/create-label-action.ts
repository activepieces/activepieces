import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_create_label',
  displayName: 'Create Label',
  description: 'Create a new user label in Gmail',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the label to create',
      required: true,
    }),
    labelListVisibility: Property.StaticDropdown({
      displayName: 'Show in Label List',
      description: 'Whether the label is shown in the label list',
      required: false,
      defaultValue: 'labelShow',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Hide', value: 'labelHide' },
          { label: 'Show if Unread', value: 'labelShowIfUnread' },
        ],
      },
    }),
    messageListVisibility: Property.StaticDropdown({
      displayName: 'Show in Message List',
      description: 'Whether the label is shown in the message list',
      required: false,
      defaultValue: 'show',
      options: {
        disabled: false,
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Hide', value: 'hide' },
        ],
      },
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      body: {
        name: context.propsValue.name,
        labelListVisibility: context.propsValue.labelListVisibility ?? 'labelShow',
        messageListVisibility: context.propsValue.messageListVisibility ?? 'show',
      },
    });
    return response.body;
  },
});
