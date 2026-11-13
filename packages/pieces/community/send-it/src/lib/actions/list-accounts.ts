import { createAction, Property } from '@activepieces/pieces-framework';
import { sendItAuth } from '../common/auth';
import { apiKeyOf } from '../common/client';
import { sendItOutputSchemas } from '../common/output-schemas';
import { sendItRequests, validateLimit } from '../common/requests';

export const listAccounts = createAction({
  auth: sendItAuth,
  name: 'list_accounts',
  classification: 'SEARCH',
  displayName: 'List Connected Accounts',
  description: 'Get a list of connected social media accounts',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the social media accounts connected to SendIt (id, platform, username, connectedAt). Use it to see which platform values can be published to before Publish Post or Schedule Post. count is the number returned in this response. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum accounts to return (1-100). Empty uses the SendIt default.',
      required: false,
    }),
  },
  outputSchema: sendItOutputSchemas.accountList,
  async run(context) {
    return sendItRequests.listAccounts({ apiKey: apiKeyOf(context.auth), limit: validateLimit({ value: context.propsValue.limit, label: 'Limit', max: 100 }) });
  },
});
