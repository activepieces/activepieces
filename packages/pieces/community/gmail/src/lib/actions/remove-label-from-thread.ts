import { createAction,Property, OAuth2PropertyValue, } from '@activepieces/pieces-framework';
import {  } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';
import { gmailCommon } from '../common/common';



export const removeLabelFromThread = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread',
  props: {
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread',
      required: true,
    }),
    labelId: Property.Dropdown({
      displayName: 'Label',
      description: 'The label to remove from the thread',
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
    const { threadId, labelId } = propsValue;
    
    return gmailCommon.makeRequest(
      authData.access_token,
      'POST',
      `/users/me/threads/${threadId}/modify`,
      {
        removeLabelIds: [labelId],
      }
    );
  },
});
