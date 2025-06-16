import { createAction, Property, OAuth2PropertyValue  } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';

export const addLabelToEmail = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Add a label to a specific email',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message',
      required: true,
    }),
    labelId: Property.Dropdown({
      displayName: 'Label',
      description: 'The label to add to the email',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        
        try {
          const authData = auth as OAuth2PropertyValue;
          const response = await gmailCommon.getLabels(authData.access_token);
          return {
            options: response.labels.map((label: any) => ({
              label: label.name,
              value: label.id,
            })),
          };
        } catch (error) {
          console.error('Error fetching labels:', error);
          return { options: [] };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const authData = auth as OAuth2PropertyValue;
    const { messageId, labelId } = propsValue;
    
    return gmailCommon.makeRequest(
      authData.access_token,
      'POST',
      `/users/me/messages/${messageId}/modify`,
      {
        addLabelIds: [labelId],
      }
    );
  },
});