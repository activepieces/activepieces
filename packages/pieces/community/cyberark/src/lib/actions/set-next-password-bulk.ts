import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';

interface BulkItem {
  accountId: string;
  changeImmediately?: boolean;
  newCredentials?: string;
}

export const setNextPasswordBulk = createAction({
  auth: cyberarkAuth,
  name: 'set_next_password_bulk',
  displayName: 'Set Next Password in Bulk',
  description:
    'Sets multiple accounts\' credentials to use for the next CPM change',
  audience: 'both',
  aiMetadata: {
    description: 'Sets the specific credential value the CPM will apply on the next change for a list of CyberArk accounts (each item carries an account ID, an optional changeImmediately flag, and the new credentials). Use to pre-stage a known password for accounts rather than letting the CPM pick a random one. Not idempotent: each call writes a new pending/applied credential and, when changeImmediately is set, triggers a change.',
    idempotent: false,
  },
  props: {
    bulkItems: Property.Array({
      displayName: 'Bulk Items',
      description: 'List of account items. Each item should be a JSON object with accountId (required), changeImmediately (optional), and newCredentials (optional).',
      required: true,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const bulkItems: BulkItem[] = (context.propsValue.bulkItems as unknown[]).map((item) => {
      if (typeof item === 'string') {
        return JSON.parse(item) as BulkItem;
      }
      return item as BulkItem;
    });

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/SetNextPassword/Bulk`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token,
        },
        body: {
          bulkItems,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          details: response.body,
        };
      } else {
        return {
          success: false,
          error: `Failed to set next password in bulk. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to set next password in bulk',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
