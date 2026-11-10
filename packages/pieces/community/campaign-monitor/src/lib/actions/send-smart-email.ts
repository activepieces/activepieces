import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, smartEmailId } from '../common/props';
import { sendSmartEmailOutputSchema } from '../output-schemas';

export const sendSmartEmailAction = createAction({
  auth: campaignMonitorAuth,
  name: 'send_smart_email',
  classification: 'WRITE',
  displayName: 'Send Smart Transactional Email',
  description: 'Sends a smart transactional email to one or more recipients.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an existing Campaign Monitor smart transactional email template to the given recipients, filling its variables from Data, and returns one message ID per recipient. Choose this for one-off transactional sends such as receipts or password resets. Not idempotent: each call sends the email again.',
    idempotent: false,
  },
  outputSchema: sendSmartEmailOutputSchema,
  props: {
    clientId: clientId,
    smartEmailId: smartEmailId,
    to: Property.Array({
      displayName: 'To',
      description:
        'Recipients, as an email address or "Name <email@example.com>".',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      required: false,
    }),
    data: Property.Json({
      displayName: 'Data',
      description: 'Values for the smart email variables, as a JSON object.',
      required: false,
      defaultValue: {},
    }),
    addRecipientsToList: Property.Checkbox({
      displayName: 'Add Recipients to List',
      description:
        'Add the recipients to the list configured on the smart email.',
      required: false,
      defaultValue: false,
    }),
    consentToTrack: Property.StaticDropdown({
      displayName: 'Consent to Track',
      description: 'Whether the recipients have consented to tracking.',
      required: true,
      defaultValue: 'Unchanged',
      options: {
        options: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' },
          { label: 'Unchanged', value: 'Unchanged' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const to = toAddressList(propsValue.to);
    if (to.length === 0) {
      throw new Error('Add at least one recipient in To.');
    }
    const cc = toAddressList(propsValue.cc);
    const bcc = toAddressList(propsValue.bcc);
    const response = await makeRequest<
      {
        MessageID: string;
        Recipient: string;
        Status: string;
      }[]
    >({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/transactional/smartEmail/${propsValue.smartEmailId}/send`,
      body: {
        To: to,
        CC: cc.length > 0 ? cc : undefined,
        BCC: bcc.length > 0 ? bcc : undefined,
        Data: propsValue.data ?? {},
        AddRecipientsToList: propsValue.addRecipientsToList ?? false,
        ConsentToTrack: propsValue.consentToTrack,
      },
    });
    return response.body;
  },
});

function toAddressList(value: unknown[] | undefined) {
  return (value ?? [])
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}
