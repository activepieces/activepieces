import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updatePersonAction = createAction({
  name: 'update_person',
  auth: outsetaAuth,
  displayName: 'Update Person',
  description: 'Update an existing person in Outseta',
  props: {
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phoneMobile: Property.ShortText({
      displayName: 'Mobile Phone',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {};
    if (context.propsValue.email) body['Email'] = context.propsValue.email;
    if (context.propsValue.firstName)
      body['FirstName'] = context.propsValue.firstName;
    if (context.propsValue.lastName)
      body['LastName'] = context.propsValue.lastName;
    if (context.propsValue.phoneMobile)
      body['PhoneMobile'] = context.propsValue.phoneMobile;
    if (context.propsValue.title) body['Title'] = context.propsValue.title;

    const result = await client.put<any>(
      `/api/v1/crm/people/${context.propsValue.personUid}`,
      body
    );

    return result;
  },
});
