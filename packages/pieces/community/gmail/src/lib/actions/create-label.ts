import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailClient } from '../common/client';

export const createLabel = createAction({
  name: 'create-label',
  displayName: 'Create Label',
  description: 'Creates a new Gmail label.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
  },
  async run(context) {
    const gmail = await gmailClient(context.auth);

    const res = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: context.propsValue.name,
      },
    });

    return res.data;
  },
});
