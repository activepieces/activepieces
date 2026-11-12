import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { ccData } from '../../common/types';
import { accountEmailsOutputSchema } from '../../common/output-schemas';

export const listAccountEmailsAiAction = createAction({
  auth: constantContactAuth,
  name: 'list_account_emails_ai',
  classification: 'SEARCH',
  displayName: 'List Sender Email Addresses',
  description: 'Lists the email addresses of the account that can send campaigns.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the sender email addresses of the Constant Contact account and whether each is CONFIRMED. Only a CONFIRMED address can be used as from_email or reply_to_email of a campaign draft. Needs the account_read permission (reconnect if missing).',
    idempotent: true,
  },
  outputSchema: accountEmailsOutputSchema,
  props: {
    confirm_status: aiProps.text({ displayName: 'Confirm Status', description: 'Optional filter: CONFIRMED or UNCONFIRMED.' }),
  },
  async run({ auth, propsValue }) {
    const status = ccInput.optionalText(propsValue.confirm_status)?.toUpperCase();
    if (status !== undefined && status !== 'CONFIRMED' && status !== 'UNCONFIRMED') {
      throw new Error('Confirm Status must be CONFIRMED or UNCONFIRMED.');
    }
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'GET',
      path: '/account/emails',
      operation: 'list sender email addresses',
      query: { confirm_status: status },
      requiredScope: 'account_read',
    });
    return { emails: Array.isArray(response.body) ? response.body.filter(ccData.isRecord) : [] };
  },
});
