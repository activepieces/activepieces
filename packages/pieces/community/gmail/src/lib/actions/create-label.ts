import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new label in Gmail.',
  props: {
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
  },
  async run(context) {
    return await GmailRequests.createLabel(context.auth, context.propsValue.name);
  },
});
