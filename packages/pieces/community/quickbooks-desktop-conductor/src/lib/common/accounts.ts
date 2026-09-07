import { HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import { conductorClient, ConductorAuth } from './client';
import { ConductorApiError } from './errors';

type ConductorAccountLookupResult = {
  id: string;
  fullName: string;
};

/**
 * Resolves an expense account's human-readable name (e.g. "Expenses:Fuel") to the opaque
 * `accountId` QuickBooks Desktop bill expense lines need — same rationale as
 * `resolveItemIdByName` in `items.ts`: users type a name they recognize from their Chart of
 * Accounts, never an opaque id.
 */
export async function resolveAccountIdByName({
  auth,
  name,
}: {
  auth: ConductorAuth;
  name: string;
}): Promise<string> {
  const { data, error } = await tryCatch(() =>
    conductorClient.request<{ data: ConductorAccountLookupResult[] }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/quickbooks-desktop/accounts',
      queryParams: { fullNames: name },
    })
  );
  if (error) {
    if (error instanceof ConductorApiError && error.isNotFound) {
      throw new Error(
        `Account "${name}" was not found in QuickBooks Desktop's Chart of Accounts. Check the exact name (Lists > Chart of Accounts) — sub-accounts use "Parent:Child" form, e.g. "Expenses:Fuel".`
      );
    }
    throw error;
  }
  return data.data[0].id;
}
