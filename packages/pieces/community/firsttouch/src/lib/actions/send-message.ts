import { createAction, Property } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { linkedinUtils } from '../common/linkedin';
import { firstTouchProps } from '../common/props';

export const sendMessageAction = createAction({
  auth: firstTouchAuth,
  name: 'send_message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Send a LinkedIn message to someone a teammate is connected to.',
  audience: 'both',
  aiMetadata: {
    description:
      "Queues a LinkedIn direct message to one person from a teammate's account; the sender must already be connected to them (check with Check Connection Status). Paced by FirstTouch and, by default, waits for human approval in FirstTouch Tasks. Each call creates a new message task, so retries can duplicate.",
    idempotent: false,
  },
  props: {
    ...linkedinUtils.contactProps(),
    sender: firstTouchProps.teammateDropdown({
      displayName: 'Send From',
      description: 'The teammate whose LinkedIn account sends. Leave empty for the owner of the API key.',
    }),
    message: Property.LongText({ displayName: 'Message', required: true }),
    ...linkedinUtils.optionalContextProps(),
  },
  async run(context) {
    return linkedinUtils.startContactSequence({
      apiKey: context.auth.secret_text,
      actionType: 'linkedin_message',
      label: 'Send Message',
      props: context.propsValue,
      extra: { message: context.propsValue.message },
    });
  },
});
