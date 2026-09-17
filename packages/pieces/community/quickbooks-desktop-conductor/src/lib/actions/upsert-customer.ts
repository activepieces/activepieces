import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tryCatch, spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, withStaleRevisionRetry, withRecordLockRetry, ConductorAuth } from '../common/client';
import { ConductorApiError } from '../common/errors';
import { buildBillingAddress, billingAddressProps, billingAddressPropertyGroup, ConductorAddress } from '../common/address';
import { upsertCustomerActionOutputSchema } from '../output-schemas';

const MAX_NAME_LENGTH = 41;

type ConductorCustomer = {
  id: string;
  name: string;
  fullName: string;
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

async function lookupCustomerByName({
  auth,
  name,
}: {
  auth: ConductorAuth;
  name: string;
}): Promise<ConductorCustomer | undefined> {
  const { data, error } = await tryCatch(() =>
    conductorClient.request<{ data: ConductorCustomer[] }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: '/quickbooks-desktop/customers',
      queryParams: { fullNames: name },
    })
  );
  if (error) {
    // An exact `fullNames` filter that matches nothing comes back as an error, not an empty
    // list — that specific case just means "no existing customer." Anything else is a real
    // failure and shouldn't be treated as "doesn't exist yet."
    if (error instanceof ConductorApiError && error.isNotFound) {
      return undefined;
    }
    throw error;
  }
  return data.data[0];
}

function flattenCustomer(customer: ConductorCustomer) {
  return {
    id: customer.id,
    name: customer.name,
    full_name: customer.fullName,
    company_name: customer.companyName,
    is_active: customer.isActive,
    email: customer.email,
    phone: customer.phone,
    note: customer.note,
    billing_address_line1: customer.billingAddress?.line1 ?? null,
    billing_address_city: customer.billingAddress?.city ?? null,
    billing_address_state: customer.billingAddress?.state ?? null,
    billing_address_postal_code: customer.billingAddress?.postalCode ?? null,
    billing_address_country: customer.billingAddress?.country ?? null,
    revision_number: customer.revisionNumber,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}

export const upsertCustomerAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'upsert_customer',
  classification: 'WRITE',
  displayName: 'Upsert Customer',
  description: 'Creates a customer in QuickBooks Desktop, or updates it if one with the same name already exists.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create or update a QuickBooks Desktop customer, matched by exact name. Use this before creating an invoice or receiving a payment for a customer that may not exist yet — it looks the customer up first and updates it instead of creating a duplicate. Safe to retry: calling it again with the same name always resolves to the same customer record.',
    idempotent: true,
  },
  outputSchema: upsertCustomerActionOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Customer Name',
      description:
        `The exact name of the customer as it should appear in QuickBooks Desktop (max ${MAX_NAME_LENGTH} characters). Used to find an existing customer — if one already exists with this exact name, it is updated instead of duplicated.`,
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
      // Caught here rather than left to Conductor: an over-length name comes back as a generic
      // "internal server error" from their side, so failing fast gives the real reason instead.
      throw new Error(
        `Customer name must be ${MAX_NAME_LENGTH} characters or fewer (QuickBooks Desktop's limit) — "${propsValue.name}" is ${propsValue.name.length}.`
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

    const existingCustomer = await lookupCustomerByName({ auth, name: propsValue.name });

    if (existingCustomer) {
      const updatedCustomer = await withRecordLockRetry(() =>
        withStaleRevisionRetry({
          revisionNumber: existingCustomer.revisionNumber,
          attempt: (revisionNumber) =>
            conductorClient.request<ConductorCustomer>({
              auth,
              method: HttpMethod.POST,
              resourceUri: `/quickbooks-desktop/customers/${existingCustomer.id}`,
              body: { ...body, revisionNumber },
            }),
          refetchRevisionNumber: async () => {
            const fresh = await lookupCustomerByName({ auth, name: propsValue.name });
            if (!fresh) {
              throw new Error(`Customer "${propsValue.name}" no longer exists in QuickBooks Desktop.`);
            }
            return fresh.revisionNumber;
          },
        })
      );
      return flattenCustomer(updatedCustomer);
    }

    const createdCustomer = await withRecordLockRetry(() =>
      conductorClient.request<ConductorCustomer>({
        auth,
        method: HttpMethod.POST,
        resourceUri: '/quickbooks-desktop/customers',
        body,
        // This is the create branch (no id in the URL) — see client.ts's `request` doc on why
        // creates opt out of retry. The update branch above keeps the default: a resent update
        // either matches the same revisionNumber or gets rejected as stale, never duplicated.
        safeToRetry: false,
      })
    );
    return flattenCustomer(createdCustomer);
  },
});
