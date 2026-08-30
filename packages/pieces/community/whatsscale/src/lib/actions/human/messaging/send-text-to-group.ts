import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';

export const sendTextToGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_to_group',
  classification: 'WRITE',
  displayName: 'Send a Message to a Group',
  description:
    'Send a text message to a WhatsApp group selected from your group list',
  audience: 'human',
  aiMetadata: { description: 'Sends a text message to a WhatsApp group whose chat ID is chosen from the session group list. Pick this when the recipient is a known group; use the manual-entry text action for a raw group ID, or the contact/CRM/channel text variants for other recipient types. Not idempotent: each call sends another message.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'group'] },
    { key: 'content', display: 'section' as const, label: 'Message', props: ['text'] },
  ],
  async run(context) {
    const { session, group, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(RecipientType.GROUP, session, group);
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendText',
      { ...body, text },
    );

    return await resolveSendResult({ apiKey: auth, body: response.body });
  },
});
