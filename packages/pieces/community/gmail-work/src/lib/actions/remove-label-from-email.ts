import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';


export const removeLabelFromEmail = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove a label from a specific email',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message',
      required: true,
    }),
    labelId: Property.Dropdown({
      displayName: 'Label',
      description: 'The label to remove from the email',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        
        try {
          const response = await gmailCommon.getLabels(auth.access_token);
          return {
            options: response.labels.map((label: any) => ({
              label: label.name,
              value: label.id,
            })),
          };
        } catch (error) {
          return { options: [] };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { messageId, labelId } = propsValue;
    
    return gmailCommon.makeRequest(
      auth.access_token,
      'POST',
      `/users/me/messages/${messageId}/modify`,
      {
        removeLabelIds: [labelId],
      }
    );
  },
});