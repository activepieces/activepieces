import { Property } from '@activepieces/pieces-framework';
import { handleDropdownError, MAX_PAGE_SIZE } from './constants';
import { bigCommerceApiService, BigCommerceRecord } from './requests';
import { bigcommerceAuth } from './auth';

const MAX_DROPDOWN_PAGES = 20;

async function loadCustomerOptions({
  auth,
}: {
  auth: { storeHash: string; accessToken: string };
}) {
  const options: { label: string; value: number }[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await bigCommerceApiService.fetchCustomers({
      auth,
      query: { limit: MAX_PAGE_SIZE, page, sort: 'last_name:asc' },
    });
    for (const user of response.data) {
      const option = toCustomerOption(user);
      if (option) options.push(option);
    }
    totalPages = response.meta?.pagination?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_DROPDOWN_PAGES);
  return { options, truncated: totalPages > MAX_DROPDOWN_PAGES };
}

function toCustomerOption(user: BigCommerceRecord): { label: string; value: number } | null {
  const id = user['id'];
  if (typeof id !== 'number') return null;
  const fullName = [user['first_name'], user['last_name']]
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
    .join(' ');
  const email = typeof user['email'] === 'string' ? user['email'] : '';
  const label = fullName && email ? `${fullName} (${email})` : fullName || email || String(id);
  return { label, value: id };
}

async function customerOptions({
  auth,
}: {
  auth: { props: { storeHash: string; accessToken: string } } | undefined;
}) {
  if (!auth) return handleDropdownError('Please connect your account first');
  try {
    const { options, truncated } = await loadCustomerOptions({ auth: auth.props });
    if (options.length === 0) {
      return handleDropdownError('No customers found');
    }
    return {
      disabled: false,
      options,
      placeholder: truncated
        ? `Showing the first ${options.length} customers. Use Search Customer to find others by email.`
        : undefined,
    };
  } catch (error) {
    return handleDropdownError(
      `Failed to load customers: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const customerDropdown = ({ required }: { required: boolean }) =>
  Property.Dropdown({
    auth: bigcommerceAuth,
    displayName: 'Customer',
    description: 'Select the customer',
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => customerOptions({ auth }),
  });

export const multiCustomerDropdown = ({ required }: { required: boolean }) =>
  Property.MultiSelectDropdown({
    auth: bigcommerceAuth,
    displayName: 'Customers',
    description: 'Select the customers',
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => customerOptions({ auth }),
  });

export const pagingProps = {
  limit: Property.Number({
    displayName: 'Limit',
    description: `Number of results per page (1-${MAX_PAGE_SIZE}). Leave empty for the BigCommerce default of 50.`,
    required: false,
  }),
  page: Property.Number({
    displayName: 'Page',
    description: 'Page number to return, starting at 1. Leave empty for the first page.',
    required: false,
  }),
};

export const addressInputProps = {
  first_name: Property.ShortText({
    displayName: 'First Name',
    description: 'First name of the person at this address',
    placeholder: 'Jane',
    required: true,
  }),
  last_name: Property.ShortText({
    displayName: 'Last Name',
    description: 'Last name of the person at this address',
    placeholder: 'Doe',
    required: true,
  }),
  address1: Property.ShortText({
    displayName: 'Address Line 1',
    description: 'Street address',
    placeholder: '123 Main Street',
    required: true,
  }),
  city: Property.ShortText({
    displayName: 'City',
    description: 'City or town',
    placeholder: 'Austin',
    required: true,
  }),
  state_or_province: Property.ShortText({
    displayName: 'State/Province',
    description: 'Full state or province name',
    placeholder: 'Texas',
    required: true,
  }),
  postal_code: Property.ShortText({
    displayName: 'Postal Code',
    description: 'ZIP or postal code',
    placeholder: '78701',
    required: true,
  }),
  country_code: Property.ShortText({
    displayName: 'Country Code',
    description: 'Two-letter ISO 3166-1 alpha-2 country code',
    placeholder: 'US',
    required: true,
  }),
  address2: Property.ShortText({
    displayName: 'Address Line 2',
    description: 'Apartment, suite or unit (optional)',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: 'Phone number for this address (optional)',
    required: false,
  }),
};
