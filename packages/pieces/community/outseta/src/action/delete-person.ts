import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const deletePersonAction = createAction({
  name: 'delete_person',
  auth: outsetaAuth,
  displayName: 'Delete Person',
  description: 'Delete a person from Outseta CRM.',
  props: {
    personUid: Property.ShortText({
      displayName: 'Person UID',
      description: 'The UID of the person to delete.',
      required: true,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    await client.delete<unknown>(`/api/v1/crm/people/${context.propsValue.personUid}`);

    return { deleted: true, person_uid: context.propsValue.personUid };
  },
});
