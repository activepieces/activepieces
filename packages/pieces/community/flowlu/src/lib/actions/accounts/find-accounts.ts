import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluFind, flowluInput, flowluSharedProps } from '../../common/utils';
import { accountListOutputSchema } from '../../output-schemas';

export const findAccountsAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_find_accounts',
  classification: 'SEARCH',
  displayName: 'Find CRM Accounts',
  description: 'Searches CRM contacts and organizations.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Flowlu CRM accounts by text (matches names and other text fields) and optional filters for account type, owner and active state, returning one page of matching contacts/organizations with has_more for paging. Use to find an account ID before getting, updating, linking or deleting it, or to check for duplicates before creating one. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: flowluSharedProps.search(
      'Text to look for in account names and other text fields, such as "Acme". Leave empty to list all.'
    ),
    account_type: Property.StaticDropdown({
      displayName: 'Account Type',
      description: 'Only contacts, only organizations, or both.',
      required: false,
      defaultValue: 'any',
      options: {
        disabled: false,
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Contacts', value: 'contact' },
          { label: 'Organizations', value: 'organization' },
        ],
      },
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner User ID',
      description:
        'Only accounts owned by this user. Numeric user ID from List Users.',
      required: false,
    }),
    include_inactive: Property.Checkbox({
      displayName: 'Include Inactive',
      description: 'Also return accounts marked inactive.',
      required: false,
      defaultValue: false,
    }),
    order: flowluSharedProps.order(),
    page: flowluSharedProps.page(),
    limit: flowluSharedProps.limit(),
  },
  outputSchema: accountListOutputSchema,
  async run(context) {
    const type = context.propsValue.account_type;
    return flowluFind.run({
      client: makeClient(context.auth),
      module: 'crm',
      entity: 'account',
      props: context.propsValue,
      filters: {
        'filter[type]':
          type === 'contact' ? 2 : type === 'organization' ? 1 : undefined,
        'filter[owner_id]': flowluInput.optionalId({
          value: context.propsValue.owner_id,
          name: 'Owner User ID',
        }),
        'filter[active]': context.propsValue.include_inactive ? undefined : 1,
      },
    });
  },
});
