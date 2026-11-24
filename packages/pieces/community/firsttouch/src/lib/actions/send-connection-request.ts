import { createAction, Property } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { linkedinUtils } from '../common/linkedin';
import { firstTouchProps } from '../common/props';

export const sendConnectionRequestAction = createAction({
  auth: firstTouchAuth,
  name: 'send_connection_request',
  classification: 'WRITE',
  displayName: 'Send Connection Request',
  description: 'Send a LinkedIn connection request from a teammate, with an optional note.',
  audience: 'both',
  aiMetadata: {
    description:
      "Queues a LinkedIn connection request to one person from a teammate's account, paced by FirstTouch and, by default, waiting for human approval in FirstTouch Tasks. Fails with a plain message if the sender is already connected; use Check Connection Status first and Send Message for existing connections. Each call creates a new request task, so retries can duplicate.",
    idempotent: false,
  },
  props: {
    ...linkedinUtils.contactProps(),
    sender: firstTouchProps.teammateDropdown({
      displayName: 'Send From',
      description: 'The teammate whose LinkedIn account sends. Leave empty for the owner of the API key.',
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional connection note, up to about 300 characters.',
      required: false,
    }),
    ...linkedinUtils.optionalContextProps(),
  },
  async run(context) {
    try {
      return await linkedinUtils.startContactSequence({
        apiKey: context.auth.secret_text,
        actionType: 'linkedin_connect',
        label: 'Send Connection Request',
        props: context.propsValue,
        extra: { message: linkedinUtils.emptyToUndefined(context.propsValue.note) ?? '' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (/already connected/i.test(message)) {
        const who = (message.match(/sender '([^']+)'/) ?? [])[1] ?? 'The sender';
        throw new Error(
          `${who} is already connected to this contact on LinkedIn, so no request was sent. Add a Check Connection Status step with a Router to message existing connections instead.`,
        );
      }
      throw error;
    }
  },
});
