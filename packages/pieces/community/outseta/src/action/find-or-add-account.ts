import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const findOrAddAccountAction = createAction({
  name: 'find_or_add_account',
  auth: outsetaAuth,
  displayName: 'Find or Add Account',
  description:
    'Search for an account by name. If not found, create a new one.',
  props: {
    name: Property.ShortText({
      displayName: 'Account Name',
      required: true,
      description: 'Name to search for (or to use when creating)',
    }),
    contactEmail: Property.ShortText({
      displayName: 'Primary Contact Email',
      required: false,
      description: 'Email for the primary contact (used when creating)',
    }),
    contactFirstName: Property.ShortText({
      displayName: 'Primary Contact First Name',
      required: false,
      description: 'First name for the primary contact (used when creating)',
    }),
    contactLastName: Property.ShortText({
      displayName: 'Primary Contact Last Name',
      required: false,
      description: 'Last name for the primary contact (used when creating)',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Search for existing account by name
    const searchResult = await client.get<any>(
      `/api/v1/crm/accounts?Name=${encodeURIComponent(context.propsValue.name)}&limit=100`
    );

    const items = searchResult?.items ?? searchResult?.Items ?? [];
    const exactMatch = items.find(
      (item: any) => item.Name === context.propsValue.name
    );
    if (exactMatch) {
      return {
        created: false,
        account: exactMatch,
      };
    }

    // Not found, create a new account
    const body: Record<string, unknown> = {
      Name: context.propsValue.name,
    };

    if (context.propsValue.contactEmail) {
      body['PersonAccount'] = [
        {
          Person: {
            Email: context.propsValue.contactEmail,
            FirstName: context.propsValue.contactFirstName ?? '',
            LastName: context.propsValue.contactLastName ?? '',
          },
          IsPrimary: true,
        },
      ];
    }

    const newAccount = await client.post<any>(
      `/api/v1/crm/accounts`,
      body
    );

    return {
      created: true,
      account: newAccount,
    };
  },
});
