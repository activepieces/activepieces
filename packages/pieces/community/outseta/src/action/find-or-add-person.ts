import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const findOrAddPersonAction = createAction({
  name: 'find_or_add_person',
  auth: outsetaAuth,
  displayName: 'Find or Add Person',
  description:
    'Search for a person by email. If not found, create a new one.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'Email to search for (or to use when creating)',
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      description: 'Used when creating a new person',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      description: 'Used when creating a new person',
    }),
    phoneMobile: Property.ShortText({
      displayName: 'Mobile Phone',
      required: false,
      description: 'Used when creating a new person',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Search for existing person by email
    const searchResult = await client.get<any>(
      `/api/v1/crm/people?Email=${encodeURIComponent(context.propsValue.email)}&limit=100`
    );

    const items = searchResult?.items ?? searchResult?.Items ?? [];
    const exactMatch = items.find(
      (item: any) =>
        item.Email?.toLowerCase() === context.propsValue.email.toLowerCase()
    );
    if (exactMatch) {
      return {
        created: false,
        person: exactMatch,
      };
    }

    // Not found, create a new person
    const body: Record<string, unknown> = {
      Email: context.propsValue.email,
    };
    if (context.propsValue.firstName)
      body['FirstName'] = context.propsValue.firstName;
    if (context.propsValue.lastName)
      body['LastName'] = context.propsValue.lastName;
    if (context.propsValue.phoneMobile)
      body['PhoneMobile'] = context.propsValue.phoneMobile;

    const newPerson = await client.post<any>(`/api/v1/crm/people`, body);

    return {
      created: true,
      person: newPerson,
    };
  },
});
