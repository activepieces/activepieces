import { createAction, Property } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { linkedinUtils } from '../common/linkedin';
import { firstTouchProps } from '../common/props';

export const sendInmailAction = createAction({
  auth: firstTouchAuth,
  name: 'send_inmail',
  classification: 'WRITE',
  displayName: 'Send InMail',
  description: 'Send a LinkedIn InMail from a teammate with LinkedIn Premium or Sales Navigator.',
  audience: 'both',
  aiMetadata: {
    description:
      "Queues a LinkedIn InMail to one person the sender is not connected to; the sender needs LinkedIn Premium or Sales Navigator. Paced by FirstTouch and, by default, waits for human approval in FirstTouch Tasks. Each call creates a new InMail task, so retries can duplicate.",
    idempotent: false,
  },
  props: {
    ...linkedinUtils.contactProps(),
    sender: firstTouchProps.teammateDropdown({
      displayName: 'Send From',
      description: 'The teammate whose LinkedIn account sends. Leave empty for the owner of the API key.',
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    body: Property.LongText({ displayName: 'InMail Body', required: true }),
    ...linkedinUtils.optionalContextProps(),
  },
  async run(context) {
    return linkedinUtils.startContactSequence({
      apiKey: context.auth.secret_text,
      actionType: 'linkedin_inmail',
      label: 'Send InMail',
      props: context.propsValue,
      extra: { subject: context.propsValue.subject, prompt: context.propsValue.body },
    });
  },
});
