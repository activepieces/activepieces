import {
  createAction,
  isNil,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaErrors } from '../common/errors';
import { outsetaLookup } from '../common/lookup';
import { outsetaMappers } from '../common/mappers';
import { OutsetaAccount, OutsetaPerson } from '../common/outseta-types';

export const getAccountAction = createAction({
  name: 'get_account',
  auth: outsetaAuth,
  displayName: 'Retrieve Account',
  description:
    'Retrieve an account by its UID, or by the email of its primary contact. Returns the account, its addresses, its primary contact and which plan it is on. Returns found=false when nothing matches.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches a single Outseta CRM account by its UID or by a contact email, returning account fields, billing and mailing address, primary contact, custom properties, and the current subscription UID plus plan UID and name. For subscription dates, rate, quantity or add-ons use Retrieve Subscription, which also accepts an account UID. Fill exactly one lookup field. Returns found=false instead of failing. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'lookup',
      display: 'tabs',
      label: 'Find account by',
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
      displayName: 'Contact email',
      description: 'Resolved to the account this person belongs to.',
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
        label: 'Contact email',
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

    if (isNil(account)) {
      return { found: false, ...outsetaMappers.account({}) };
    }

    return { found: true, ...outsetaMappers.account(account) };
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
    client.get<OutsetaAccount>(`/api/v1/crm/accounts/${uid}?${ACCOUNT_FIELDS}`)
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

const ACCOUNT_FIELDS =
  'fields=*,BillingAddress.*,MailingAddress.*,PrimaryContact.Uid,PrimaryContact.Email,PrimaryContact.FirstName,PrimaryContact.LastName,CurrentSubscription.Uid,CurrentSubscription.Plan.Uid,CurrentSubscription.Plan.Name';
