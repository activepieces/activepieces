import {
  createAction,
  isNil,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaCustomProperties } from '../common/custom-properties';
import { outsetaFields } from '../common/fields';
import { outsetaErrors } from '../common/errors';
import { outsetaLookup } from '../common/lookup';
import { outsetaMappers } from '../common/mappers';
import { OutsetaAccount, OutsetaPerson } from '../common/outseta-types';

export const getAccountAction = createAction({
  name: 'get_account',
  classification: 'READ',
  auth: outsetaAuth,
  displayName: 'Retrieve Account',
  description:
    'Retrieve an account by its UID, or by the email of a person on it (if the person belongs to several accounts, the first one is used). Returns the account, its addresses, its primary contact and which plan it is on. Returns found=false when nothing matches.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Outseta CRM account by its UID or by the email of any person on it (resolved to that person\'s first account), returning account fields, billing and mailing address, primary contact, custom properties, and the current subscription UID plus plan UID and name. For subscription dates, rate, quantity or add-ons use Retrieve Subscription, which also accepts an account UID. Fill exactly one lookup field. Returns found=false instead of failing. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'lookup',
      display: 'tabs',
      label: 'Find Account By',
      description: 'Fill one of the two — whichever tab you leave filled is the one used.',
      props: ['accountUid', 'primaryContactEmail'],
    },
  ],
  props: {
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: false,
      placeholder: '1QpnM0nW',
    }),
    primaryContactEmail: Property.ShortText({
      displayName: 'Contact Email',
      description:
        'The email of any person on the account, not only its primary contact. If the person belongs to several accounts, the first one is used.',
      required: false,
      placeholder: 'jane@example.com',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const lookup = outsetaLookup.single([
      { key: 'accountUid', label: 'Account UID', value: context.propsValue.accountUid },
      {
        key: 'primaryContactEmail',
        label: 'Contact Email',
        value: context.propsValue.primaryContactEmail,
      },
    ]);

    const accountUid =
      lookup.key === 'accountUid'
        ? lookup.value
        : await accountUidByEmail({ client, email: lookup.value });

    const account = isNil(accountUid)
      ? null
      : await accountByUid({ client, uid: accountUid });

    const customPropertyNames = await outsetaCustomProperties.names({
      client,
      entityType: 'Account',
    });

    if (isNil(account)) {
      return {
        found: false,
        ...outsetaMappers.account({ raw: {}, customPropertyNames }),
      };
    }

    return {
      found: true,
      ...outsetaMappers.account({ raw: account, customPropertyNames }),
    };
  },
});

async function accountByUid({
  client,
  uid,
}: {
  client: OutsetaClient;
  uid: string;
}): Promise<OutsetaAccount | null> {
  const { data, error } = await tryCatch(() =>
    client.get<OutsetaAccount>(`/api/v1/crm/accounts/${uid}?${outsetaFields.account}`)
  );

  if (error) {
    if (outsetaErrors.isNotFound(error)) {
      return null;
    }
    throw error;
  }

  return data;
}

async function accountUidByEmail({
  client,
  email,
}: {
  client: OutsetaClient;
  email: string;
}): Promise<string | null> {
  const people = await client.getAllPages<OutsetaPerson>(
    `/api/v1/crm/people?Email=${encodeURIComponent(
      email
    )}&fields=Uid,Email,PersonAccount.Account.Uid`
  );

  const person = people.find(
    (candidate) => candidate.Email?.toLowerCase() === email.toLowerCase()
  );

  return outsetaMappers.toArray(person?.PersonAccount)[0]?.Account?.Uid ?? null;
}
