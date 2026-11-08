import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetLinkedAccountsOutputSchema } from '../../../output-schemas';

export const getLinkedAccountsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_linked_accounts',
  outputSchema: podioGetLinkedAccountsOutputSchema,
  displayName: 'Get Linked Accounts',
  description: 'Lists the external accounts (Google, Outlook and others) linked to the connected user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the external accounts linked to the connected user, such as Google or Microsoft, with their status, provider and capabilities, optionally only those with one capability or from one provider. Use it to find the linked account id that the linked account contact, file and calendar actions take.',
    idempotent: true,
  },
  props: {
    capability: podioAiProps.choice({
      required: false,
      displayName: 'Capability',
      description: 'Only return accounts that support this capability.',
      values: ['contacts', 'files', 'meetings', 'calendar', 'profile', 'message', 'social', 'addressbook'],
    }),
    provider: podioAiProps.text({ required: false, displayName: 'Provider', description: 'Only return accounts from this provider, such as "google", "google_apps" or "live".' }),
  },
  async run({ auth, propsValue }) {
    const linkedAccounts = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/linked_account/',
      query: podioUtils.query({ values: { capability: propsValue.capability, provider: propsValue.provider } }),
    });
    return { linkedAccounts, count: linkedAccounts.length };
  },
});
