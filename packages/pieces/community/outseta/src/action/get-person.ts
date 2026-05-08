import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getPersonAction = createAction({
  name: 'get_person',
  auth: outsetaAuth,
  displayName: 'Retrieve Person',
  description:
    'Retrieve a person by email or by UID, including the linked account.',
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Lookup by',
      description: 'How to find the person to retrieve.',
      required: true,
      defaultValue: 'email',
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Person UID', value: 'uid' },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Used when "Lookup by" is set to Email.',
      required: false,
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      description: 'Used when "Lookup by" is set to Person UID.',
      required: false,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    let person: any;

    if (context.propsValue.lookupBy === 'uid') {
      const uid = context.propsValue.personUid;
      if (!uid) {
        throw new Error('Person UID is required when looking up by UID.');
      }
      person = await client.get<any>(
        `/api/v1/crm/people/${uid}?fields=*,MailingAddress.*,PersonAccount.Account.Uid,PersonAccount.Account.Name,PersonAccount.Account.AccountStage`
      );
    } else {
      const email = context.propsValue.email;
      if (!email) {
        throw new Error('Email is required when looking up by Email.');
      }
      const items = await client.getAllPages<any>(
        `/api/v1/crm/people?Email=${encodeURIComponent(email)}&fields=*,PersonAccount.Account.Uid,PersonAccount.Account.Name,PersonAccount.Account.AccountStage`
      );
      person = items.find(
        (p: any) => p.Email?.toLowerCase() === email.toLowerCase()
      );
      if (!person) {
        throw new Error(`No person found with email "${email}".`);
      }
    }

    return {
      uid: person.Uid ?? null,
      email: person.Email ?? null,
      first_name: person.FirstName ?? null,
      last_name: person.LastName ?? null,
      full_name: person.FullName ?? null,
      phone_mobile: person.PhoneMobile ?? null,
      phone_work: person.PhoneWork ?? null,
      title: person.Title ?? null,
      timezone: person.Timezone ?? null,
      language: person.Language ?? null,
      has_logged_in: person.HasLoggedIn ?? null,
      created: person.Created ?? null,
      updated: person.Updated ?? null,
      mailing_address_line1: person.MailingAddress?.AddressLine1 ?? null,
      mailing_address_line2: person.MailingAddress?.AddressLine2 ?? null,
      mailing_address_city: person.MailingAddress?.City ?? null,
      mailing_address_state: person.MailingAddress?.State ?? null,
      mailing_address_postal_code: person.MailingAddress?.PostalCode ?? null,
      mailing_address_country: person.MailingAddress?.Country ?? null,
      account_uid: firstMembership(person)?.Account?.Uid ?? null,
      account_name: firstMembership(person)?.Account?.Name ?? null,
      account_stage: firstMembership(person)?.Account?.AccountStage ?? null,
    };
  },
});

function firstMembership(person: any): any {
  // PersonAccount comes back as a direct array on /crm/people, but be
  // defensive in case the API ever wraps it in {items: [...]} like other
  // collections do.
  const list = Array.isArray(person?.PersonAccount)
    ? person.PersonAccount
    : (person?.PersonAccount?.items ?? person?.PersonAccount?.Items ?? []);
  return list[0];
}
