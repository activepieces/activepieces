import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const deletePersonAction = createAction({
  name: 'delete_person',
  auth: outsetaAuth,
  displayName: 'Delete Person',
  description: 'Delete a person from Outseta CRM.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a CRM person (contact) by its UID. Use to remove a contact entirely; to only detach them from an account use Manage Account Membership. Destructive. Not idempotent: a repeat call errors because the person no longer exists.',
    idempotent: false,
  },
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
