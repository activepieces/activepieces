import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall, normalizePhone } from '../common';

export const createGroup = createAction({
  auth: waflyAuth,
  name: 'create_group',
  displayName: 'Create Group',
  description: 'Create a WhatsApp group with a list of participants.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new WhatsApp group from a connected Wafly instance, with a name and an initial list of participant phone numbers, and returns the new group ID. Not idempotent: calling it twice creates two groups with the same name.',
    idempotent: false,
  },
  props: {
    groupName: Property.ShortText({
      displayName: 'Group Name',
      required: true,
    }),
    phones: Property.Array({
      displayName: 'Participants',
      description: 'Phone numbers in international format, e.g. 5511999999999.',
      required: true,
    }),
  },
  async run(context) {
    const { groupName, phones } = context.propsValue;

    const participants = (phones as string[])
      .map((phone) => normalizePhone(String(phone)))
      .filter((phone) => phone.length > 0);

    if (participants.length === 0) {
      throw new Error('Provide at least one participant.');
    }

    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/create-group',
      body: { groupName, phones: participants },
    });
  },
});
