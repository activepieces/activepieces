import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';
import { ChatType } from '../../common/types';

export const sendTextManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_manual',
  displayName: 'Send a Message (Manual Entry)',
  description:
    'Send a text message by entering a phone number or group ID manually',
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Send To',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Contact (Phone Number)', value: ChatType.CONTACT },
          { label: 'Group', value: ChatType.GROUP },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Phone Number or Group ID',
      required: true,
      description:
        'For contacts: phone number with country code (e.g., +31649931832). For groups: group ID (e.g., 120363318673245672)',
    }),
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  async run(context) {
    const { session, chatType, recipient, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
    );
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendText',
      { ...body, text },
    );

    return response.body;
  },
});
