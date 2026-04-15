import { createAction } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { personUidDropdown } from '../common/dropdowns';

export const getPersonAction = createAction({
  name: 'get_person',
  auth: outsetaAuth,
  displayName: 'Get Person',
  description: 'Retrieve an Outseta person by selecting them from the dropdown.',
  props: {
    personUid: personUidDropdown(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const person = await client.get<any>(
      `/api/v1/crm/people/${context.propsValue.personUid}`
    );

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
    };
  },
});
