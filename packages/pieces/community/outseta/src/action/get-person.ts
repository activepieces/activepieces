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
import { OutsetaPerson } from '../common/outseta-types';

export const getPersonAction = createAction({
  name: 'get_person',
  auth: outsetaAuth,
  displayName: 'Retrieve Person',
  description:
    'Retrieve a person by email or by UID, with their linked account and custom properties. Returns found=false when nobody matches.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches a single Outseta CRM person by email or by UID, returning identity, contact and mailing-address fields plus the linked account and any custom properties. Fill exactly one of the two lookup fields. Returns found=false instead of failing when nobody matches. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'lookup',
      display: 'tabs',
      label: 'Find person by',
      description: 'Fill one of the two — whichever tab you leave filled is the one used.',
      props: ['email', 'personUid'],
    },
  ],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      placeholder: 'jane@example.com',
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: false,
      placeholder: 'dQG7vBzQ',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const lookup = outsetaLookup.single([
      { key: 'email', label: 'Email', value: context.propsValue.email },
      { key: 'personUid', label: 'Person UID', value: context.propsValue.personUid },
    ]);

    const person =
      lookup.key === 'personUid'
        ? await personByUid({ client, uid: lookup.value })
        : await personByEmail({ client, email: lookup.value });

    if (isNil(person)) {
      return { found: false, ...outsetaMappers.person({}) };
    }

    return { found: true, ...outsetaMappers.person(person) };
  },
});

async function personByUid({
  client,
  uid,
}: {
  client: OutsetaClient;
  uid: string;
}): Promise<OutsetaPerson | null> {
  const { data, error } = await tryCatch(() =>
    client.get<OutsetaPerson>(`/api/v1/crm/people/${uid}?${PERSON_FIELDS}`)
  );

  if (error) {
    if (outsetaErrors.isNotFound(error)) {
      return null;
    }
    throw error;
  }

  return data;
}

async function personByEmail({
  client,
  email,
}: {
  client: OutsetaClient;
  email: string;
}): Promise<OutsetaPerson | null> {
  const people = await client.getAllPages<OutsetaPerson>(
    `/api/v1/crm/people?Email=${encodeURIComponent(email)}&${PERSON_FIELDS}`
  );

  return (
    people.find(
      (candidate) => candidate.Email?.toLowerCase() === email.toLowerCase()
    ) ?? null
  );
}

const PERSON_FIELDS =
  'fields=*,MailingAddress.*,PersonAccount.IsPrimary,PersonAccount.Role,PersonAccount.Account.Uid,PersonAccount.Account.Name,PersonAccount.Account.AccountStage';
