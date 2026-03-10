import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const getPersonAction = createAction({
  name: 'get_person',
  auth: outsetaAuth,
  displayName: 'Get person',
  description: 'Retrieve an Outseta person by its UID',
  props: {
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: true,
    }),
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
      personUid: context.propsValue.personUid,
      person,
      rawResponse: person,
    };
  },
});
