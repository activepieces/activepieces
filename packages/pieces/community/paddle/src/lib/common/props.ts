import { Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { paddleAuth } from '../auth';
import { paddleClient } from './client';

function customer(required = true) {
  return Property.Dropdown({
    displayName: 'Customer',
    description: 'Select the Paddle customer to use.',
    required,
    refreshers: ['auth'],
    auth: paddleAuth,
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Paddle account first.',
        };
      }

      const normalizedSearchValue = normalizeSearchValue({
        searchValue,
      });

      const { data: customers, error } = await tryCatch(() =>
        paddleClient.listCustomers({
          auth,
          limit: DEFAULT_DROPDOWN_LIMIT,
          ...(normalizedSearchValue?.includes('@')
            ? { email: normalizedSearchValue }
            : {}),
        })
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load customers. Check your connection.',
        };
      }

      const filteredCustomers = filterCustomers({
        customers,
        searchValue: normalizedSearchValue,
      });

      if (filteredCustomers.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No customers found in Paddle.',
        };
      }

      return {
        disabled: false,
        options: filteredCustomers.map((customerItem) => ({
          label: buildCustomerLabel({
            customer: customerItem,
          }),
          value: customerItem.id,
        })),
      };
    },
  });
}

function address(required = true) {
  return Property.Dropdown({
    displayName: 'Address',

    description: 'Select the Paddle address to bill against.',
    required,
    refreshers: ['auth', 'customerId'],
    auth: paddleAuth,
    options: async ({ auth, customerId, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Paddle account first.',
        };
      }

      if (!customerId || typeof customerId !== 'string') {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a customer first.',
        };
      }

      const normalizedSearchValue = normalizeSearchValue({
        searchValue,
      });

      const { data: addresses, error } = await tryCatch(() =>
        paddleClient.listAddresses({
          auth,
          customerId,
        })
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load addresses. Check your connection.',
        };
      }

      const filteredAddresses = filterAddresses({
        addresses,
        searchValue: normalizedSearchValue,
      });

      if (filteredAddresses.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No addresses found in Paddle.',
        };
      }

      return {
        disabled: false,
        options: filteredAddresses.map((addressItem) => ({
          label: buildAddressLabel({
            address: addressItem,
          }),
          value: addressItem.id,
        })),
      };
    },
  });
}

function subscription(required = true) {
  return Property.Dropdown({
    displayName: 'Subscription',
    description: 'Select the Paddle subscription to use.',
    required,
    refreshers: ['auth'],
    auth: paddleAuth,
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Paddle account first.',
        };
      }

      const { data: subscriptions, error } = await tryCatch(() =>
        paddleClient.listSubscriptions({
          auth,
          limit: DEFAULT_DROPDOWN_LIMIT,
        })
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load subscriptions. Check your connection.',
        };
      }

      const filteredSubscriptions = filterSubscriptions({
        subscriptions,
        searchValue: normalizeSearchValue({
          searchValue,
        }),
      });

      if (filteredSubscriptions.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No subscriptions found in Paddle.',
        };
      }

      return {
        disabled: false,
        options: filteredSubscriptions.map((subscriptionItem) => ({
          label: buildSubscriptionLabel({
            subscription: subscriptionItem,
          }),
          value: subscriptionItem.id,
        })),
      };
    },
  });
}

function recurringPrice(required = true) {
  return Property.Dropdown({
    displayName: 'Recurring Price',
    description: 'Select an active recurring Paddle price.',
    required,
    refreshers: ['auth'],
    auth: paddleAuth,
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Paddle account first.',
        };
      }

      const { data: prices, error } = await tryCatch(() =>
        paddleClient.listPrices({
          auth,
          limit: DEFAULT_DROPDOWN_LIMIT,
          recurring: true,
        })
      );

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load prices. Check your connection.',
        };
      }

      const filteredPrices = filterPrices({
        prices,
        searchValue: normalizeSearchValue({
          searchValue,
        }),
      });

      if (filteredPrices.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No active recurring prices found in Paddle.',
        };
      }

      return {
        disabled: false,
        options: filteredPrices.map((price) => ({
          label: buildPriceLabel({
            price,
          }),
          value: price.id,
        })),
      };
    },
  });
}

function filterAddresses({
  addresses,
  searchValue,
}: {
  addresses: Array<{
    id: string;
    country_code?: string | null;
    postal_code?: string | null;
    region?: string | null;
  }>;
  searchValue?: string;
}): Array<{
  id: string;
  country_code?: string | null;
  postal_code?: string | null;
  region?: string | null;
}> {
  if (!searchValue) {
    return addresses;
  }

  return addresses.filter((addressItem) =>
    buildAddressLabel({
      address: addressItem,
    })
      .toLowerCase()
      .includes(searchValue)
  );
}

function buildAddressLabel({
  address,
}: {
  address: {
    id: string;
    country_code?: string | null;
    postal_code?: string | null;
    region?: string | null;
  };
}): string {
  const parts = [
    address.country_code,
    address.region,
    address.postal_code,
  ].filter((part) => part != null && part.trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : address.id;
}

function normalizeSearchValue({
  searchValue,
}: {
  searchValue: unknown;
}): string | undefined {
  if (typeof searchValue !== 'string') {
    return undefined;
  }

  const normalizedValue = searchValue.trim().toLowerCase();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function filterCustomers({
  customers,
  searchValue,
}: {
  customers: Array<{
    id: string;
    name?: string | null;
    email?: string | null;
    status?: string;
  }>;
  searchValue?: string;
}): Array<{
  id: string;
  name?: string | null;
  email?: string | null;
  status?: string;
}> {
  if (!searchValue) {
    return customers;
  }

  return customers.filter((customer) =>
    buildCustomerLabel({
      customer,
    })
      .toLowerCase()
      .includes(searchValue)
  );
}

function filterSubscriptions({
  subscriptions,
  searchValue,
}: {
  subscriptions: Array<{
    id: string;
    customer_id?: string | null;
    status?: string;
    items?: Array<{
      price?: {
        name?: string | null;
      };
    }>;
  }>;
  searchValue?: string;
}): Array<{
  id: string;
  customer_id?: string | null;
  status?: string;
  items?: Array<{
    price?: {
      name?: string | null;
    };
  }>;
}> {
  if (!searchValue) {
    return subscriptions;
  }

  return subscriptions.filter((subscriptionItem) =>
    buildSubscriptionLabel({
      subscription: subscriptionItem,
    })
      .toLowerCase()
      .includes(searchValue)
  );
}

function filterPrices({
  prices,
  searchValue,
}: {
  prices: Array<{
    id: string;
    name?: string | null;
    description?: string | null;
    unit_price?: {
      amount?: string | null;
      currency_code?: string | null;
    };
  }>;
  searchValue?: string;
}): Array<{
  id: string;
  name?: string | null;
  description?: string | null;
  unit_price?: {
    amount?: string | null;
    currency_code?: string | null;
  };
}> {
  if (!searchValue) {
    return prices;
  }

  return prices.filter((price) =>
    buildPriceLabel({
      price,
    })
      .toLowerCase()
      .includes(searchValue)
  );
}

function buildCustomerLabel({
  customer,
}: {
  customer: {
    id: string;
    name?: string | null;
    email?: string | null;
    status?: string;
  };
}): string {
  const name = customer.name?.trim();
  const email = customer.email?.trim();
  const status = customer.status ?? 'unknown';

  if (name && email) {
    return `${name} (${email}) - ${status}`;
  }

  if (email) {
    return `${email} - ${status}`;
  }

  return `${customer.id} - ${status}`;
}

function buildSubscriptionLabel({
  subscription,
}: {
  subscription: {
    id: string;
    customer_id?: string | null;
    status?: string;
    items?: Array<{
      price?: {
        name?: string | null;
      };
    }>;
  };
}): string {
  const firstItemName = subscription.items?.[0]?.price?.name;

  if (firstItemName) {
    return `${subscription.id} (${
      subscription.status ?? 'unknown'
    }, ${firstItemName})`;
  }

  if (subscription.customer_id) {
    return `${subscription.id} (${subscription.status ?? 'unknown'}, ${
      subscription.customer_id
    })`;
  }

  return `${subscription.id} (${subscription.status ?? 'unknown'})`;
}

function buildPriceLabel({
  price,
}: {
  price: {
    id: string;
    name?: string | null;
    description?: string | null;
    unit_price?: {
      amount?: string | null;
      currency_code?: string | null;
    };
  };
}): string {
  const name = price.name?.trim() || price.description?.trim() || price.id;
  const amount = price.unit_price?.amount;
  const currencyCode = price.unit_price?.currency_code;

  if (amount && currencyCode) {
    return `${name} (${amount} ${currencyCode})`;
  }

  return name;
}

const DEFAULT_DROPDOWN_LIMIT = 100;

const paddleProps = {
  customer,
  recurringPrice,
  subscription,
  address,
};

export { paddleProps };
