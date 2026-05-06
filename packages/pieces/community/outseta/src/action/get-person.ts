import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getPersonAction = createAction({
  name: 'get_person',
  auth: outsetaAuth,
  displayName: 'Retrieve Person',
  description: 'Retrieve a person by email address, including the linked account.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the person to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const email = context.propsValue.email;
    const items = await client.getAllPages<any>(
      `/api/v1/crm/people?Email=${encodeURIComponent(email)}&fields=*,PersonAccount.Account.Uid,PersonAccount.Account.Name,PersonAccount.Account.AccountStage`
    );

    const person = items.find(
      (p: any) => p.Email?.toLowerCase() === email.toLowerCase()
    );

    if (!person) {
      throw new Error(`No person found with email "${email}".`);
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
      account_uid: person.PersonAccount?.[0]?.Account?.Uid ?? null,
      account_name: person.PersonAccount?.[0]?.Account?.Name ?? null,
      account_stage: person.PersonAccount?.[0]?.Account?.AccountStage ?? null,
    };
  },
});
