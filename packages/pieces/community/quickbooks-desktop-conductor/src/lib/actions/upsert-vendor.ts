import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tryCatch, spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, withStaleRevisionRetry, withRecordLockRetry, ConductorAuth } from '../common/client';
import { ConductorApiError } from '../common/errors';
import { buildBillingAddress, billingAddressProps, billingAddressPropertyGroup, ConductorAddress } from '../common/address';
import { upsertVendorActionOutputSchema } from '../output-schemas';

const MAX_NAME_LENGTH = 41;

type ConductorVendor = {
  id: string;
  name: string;
  companyName: string | null;
  isActive: boolean;
  email: string | null;
  phone: string | null;
  note: string | null;
  billingAddress: ConductorAddress | null;
  revisionNumber: string;
  createdAt: string;
  updatedAt: string;
};

async function lookupVendorByName({
  auth,
  name,
}: {
  auth: ConductorAuth;
  name: string;
}): Promise<ConductorVendor | undefined> {
  const { data, error } = await tryCatch(() =>
    conductorClient.request<{ data: ConductorVendor[] }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/quickbooks-desktop/vendors',
      // Vendors have no parent/child hierarchy, unlike customers, so the exact-match filter is
      // `names`, not `fullNames`.
      queryParams: { names: name },
    })
  );
  if (error) {
    // Same as customers: an exact-match filter with zero results raises an error instead of
    // returning an empty list.
    if (error instanceof ConductorApiError && error.isNotFound) {
      return undefined;
    }
    throw error;
  }
  return data.data[0];
}

function flattenVendor(vendor: ConductorVendor) {
  return {
    id: vendor.id,
    name: vendor.name,
    company_name: vendor.companyName,
    is_active: vendor.isActive,
    email: vendor.email,
    phone: vendor.phone,
    note: vendor.note,
    billing_address_line1: vendor.billingAddress?.line1 ?? null,
    billing_address_city: vendor.billingAddress?.city ?? null,
    billing_address_state: vendor.billingAddress?.state ?? null,
    billing_address_postal_code: vendor.billingAddress?.postalCode ?? null,
    billing_address_country: vendor.billingAddress?.country ?? null,
    revision_number: vendor.revisionNumber,
    created_at: vendor.createdAt,
    updated_at: vendor.updatedAt,
  };
}

export const upsertVendorAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'upsert_vendor',
  classification: 'WRITE',
  displayName: 'Upsert Vendor',
  description: 'Creates a vendor in QuickBooks Desktop, or updates it if one with the same name already exists.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create or update a QuickBooks Desktop vendor, matched by exact name. Use this before creating a bill or recording a bill payment for a vendor that may not exist yet — it looks the vendor up first and updates it instead of creating a duplicate. Safe to retry: calling it again with the same name always resolves to the same vendor record.',
    idempotent: true,
  },
  outputSchema: upsertVendorActionOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Vendor Name',
      description:
        `The exact name of the vendor as it should appear in QuickBooks Desktop (max ${MAX_NAME_LENGTH} characters, unique across all vendors). Used to find an existing vendor — if one already exists with this exact name, it is updated instead of duplicated.`,
      required: true,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
    ...billingAddressProps,
  },
  propertyGroups: [billingAddressPropertyGroup],
  async run(context) {
    const { propsValue } = context;
    const auth: ConductorAuth = {
      secretKey: context.auth.props.secretKey,
      endUserId: context.auth.props.endUserId,
    };

    if (propsValue.name.length > MAX_NAME_LENGTH) {
      throw new Error(
        `Vendor name must be ${MAX_NAME_LENGTH} characters or fewer (QuickBooks Desktop's limit) — "${propsValue.name}" is ${propsValue.name.length}.`
      );
    }

    const billingAddress = buildBillingAddress(propsValue);
    const body = {
      name: propsValue.name,
      ...spreadIfDefined('companyName', propsValue.companyName),
      ...spreadIfDefined('email', propsValue.email),
      ...spreadIfDefined('phone', propsValue.phone),
      ...spreadIfDefined('note', propsValue.note),
      ...spreadIfDefined('billingAddress', billingAddress),
    };

    const existingVendor = await lookupVendorByName({ auth, name: propsValue.name });

    if (existingVendor) {
      const updatedVendor = await withRecordLockRetry(() =>
        withStaleRevisionRetry({
          revisionNumber: existingVendor.revisionNumber,
          attempt: (revisionNumber) =>
            conductorClient.request<ConductorVendor>({
              auth,
              method: HttpMethod.POST,
              resourceUri: `/quickbooks-desktop/vendors/${existingVendor.id}`,
              body: { ...body, revisionNumber },
            }),
          refetchRevisionNumber: async () => {
            const fresh = await lookupVendorByName({ auth, name: propsValue.name });
            if (!fresh) {
              throw new Error(`Vendor "${propsValue.name}" no longer exists in QuickBooks Desktop.`);
            }
            return fresh.revisionNumber;
          },
        })
      );
      return flattenVendor(updatedVendor);
    }

    const createdVendor = await withRecordLockRetry(() =>
      conductorClient.request<ConductorVendor>({
        auth,
        method: HttpMethod.POST,
        resourceUri: '/quickbooks-desktop/vendors',
        body,
        // Create branch (no id in the URL) — see the matching comment in upsert-customer.ts.
        safeToRetry: false,
      })
    );
    return flattenVendor(createdVendor);
  },
});
