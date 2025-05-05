import { createAction } from '@activepieces/pieces-framework';
import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { gmailAuth } from '../../';

export const gmailLabelEmail = createAction({
  auth: gmailAuth,
  name: 'gmail_label_email',
  description: 'Add or remove labels from an email',
  displayName: 'Label Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to modify',
      required: true,
    }),
    add_labels: Property.MultiSelectDropdown({
      displayName: 'Add Labels',
      description: 'Labels to add to the email',
      required: false,
      refreshers: [],
      options: async ({ auth }: { auth: OAuth2PropertyValue | undefined }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first',
          };
        }

        const response = await GmailRequests.getLabels(
          auth as OAuth2PropertyValue
        );

        return {
          disabled: false,
          options: response.body.labels.map((label: GmailLabel) => ({
            label: label.name,
            value: label.id,
          })),
        };
      },
    }),
    remove_labels: Property.MultiSelectDropdown({
      displayName: 'Remove Labels',
      description: 'Labels to remove from the email',
      required: false,
      refreshers: [],
      options: async ({ auth }: { auth: OAuth2PropertyValue | undefined }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first',
          };
        }

        const response = await GmailRequests.getLabels(
          auth as OAuth2PropertyValue
        );

        return {
          disabled: false,
          options: response.body.labels.map((label: GmailLabel) => ({
            label: label.name,
            value: label.id,
          })),
        };
      },
    }),
  },
  run: async ({ auth, propsValue }: { auth: OAuth2PropertyValue, propsValue: any }) => {
    const { message_id, add_labels, remove_labels } = propsValue;
    
    const result = await GmailRequests.modifyEmailLabels({
      access_token: auth.access_token,
      message_id: message_id,
      add_label_ids: add_labels,
      remove_label_ids: remove_labels,
    });

    return result;
  },
});
