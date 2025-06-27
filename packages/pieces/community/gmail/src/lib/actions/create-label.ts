import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';



export const createLabel = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new label in Gmail',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'Name of the new label',
      required: true,
    }),
    messageListVisibility: Property.StaticDropdown({
      displayName: 'Message List Visibility',
      description: 'Whether the label is visible in the message list',
      required: false,
      defaultValue: 'show',
      options: {
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Hide', value: 'hide' },
        ],
      },
    }),
    labelListVisibility: Property.StaticDropdown({
      displayName: 'Label List Visibility',
      description: 'Whether the label is visible in the label list',
      required: false,
      defaultValue: 'labelShow',
      options: {
        options: [
          { label: 'Show', value: 'labelShow' },
          { label: 'Show if unread', value: 'labelShowIfUnread' },
          { label: 'Hide', value: 'labelHide' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { name, messageListVisibility, labelListVisibility } = propsValue;
    
    return gmailCommon.makeRequest(
      auth.access_token,
      'POST',
      '/users/me/labels',
      {
        name,
        messageListVisibility: messageListVisibility || 'show',
        labelListVisibility: labelListVisibility || 'labelShow',
      }
    );
  },
});
