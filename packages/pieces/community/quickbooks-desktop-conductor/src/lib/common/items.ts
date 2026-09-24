import { HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import { conductorClient, ConductorAuth } from './client';
import { ConductorApiError } from './errors';

type ConductorItemLookupResult = {
  id: string;
  fullName: string;
};

async function lookupItemByFullName({
  auth,
  resourceUri,
  name,
}: {
  auth: ConductorAuth;
  resourceUri: string;
  name: string;
}): Promise<ConductorItemLookupResult | undefined> {
  const { data, error } = await tryCatch(() =>
    conductorClient.request<{ data: ConductorItemLookupResult[] }>({
      auth,
      method: HttpMethod.GET,
      resourceUri,
      queryParams: { fullNames: name },
    })
  );
  if (error) {
    if (error instanceof ConductorApiError && error.isNotFound) {
      return undefined;
    }
    throw error;
  }
  return data.data[0];
}

/**
 * Resolves a line-item's human-readable name to the opaque `itemId` QuickBooks Desktop line
 * items actually need. `Property.Dropdown` (dynamic, single-select) is not an allowed type
 * inside `Property.Array`'s `properties` — confirmed against
 * `packages/pieces/framework/src/lib/property/input/array-property.ts`'s `ArraySubProps` schema,
 * which is also why the sibling `quickbooks` (QBO) piece's own line items use a raw ShortText for
 * `itemId` rather than a dropdown. Resolving by name server-side (same lookup-by-name shape as
 * `upsert-customer.ts`/`upsert-vendor.ts`) avoids asking users to type an opaque id.
 *
 * Checks Service Items first, then Non-Inventory Items — the two item types a service business
 * actually invoices against. Inventory, discount, other-charge, and item-group items are out of
 * scope for v1 (use `custom_api_call` for those).
 */
export async function resolveItemIdByName({
  auth,
  name,
}: {
  auth: ConductorAuth;
  name: string;
}): Promise<string> {
  const serviceItem = await lookupItemByFullName({ auth, resourceUri: '/quickbooks-desktop/service-items', name });
  if (serviceItem) {
    return serviceItem.id;
  }
  const nonInventoryItem = await lookupItemByFullName({ auth, resourceUri: '/quickbooks-desktop/non-inventory-items', name });
  if (nonInventoryItem) {
    return nonInventoryItem.id;
  }
  throw new Error(
    `Item "${name}" was not found among Service Items or Non-Inventory Items in QuickBooks Desktop. Check the exact name in QuickBooks Desktop's Item List (Lists > Item List).`
  );
}
