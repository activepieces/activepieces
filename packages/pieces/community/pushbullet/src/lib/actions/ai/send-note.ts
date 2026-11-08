import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { PushbulletPush, pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiSendNote = createAction({
  auth: bushbulletAuth,
  name: 'ai_send_note',
  displayName: 'Send Note',
  description: 'Sends a text note push.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: pushbulletOutputSchemas.push,
  aiMetadata: {
    description:
      'Sends a plain-text note push (title and body) through Pushbullet. With no target it goes to all of the account owner\'s devices; set exactly one of deviceIden (from List Devices), email (any address, e.g. from List Chats) or channelTag (a channel the user owns) to narrow it. Returns the created push, whose iden works with Dismiss Push and Delete Push. Every call creates a new push, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The headline of the notification.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The note text.',
      required: true,
    }),
    deviceIden: Property.ShortText({
      displayName: 'Device ID',
      description: 'Send only to this device. Get the ID from List Devices. Use at most one of Device ID, Email and Channel Tag; leave all empty to send to all of your own devices.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Send to this email address (a Pushbullet user or, if none, a plain email). Chat contacts come from List Chats.',
      required: false,
    }),
    channelTag: Property.ShortText({
      displayName: 'Channel Tag',
      description: 'Send to all subscribers of a channel you own, by its tag.',
      required: false,
    }),
  },
  async run(context) {
    const { title, body, deviceIden, email, channelTag } = context.propsValue;
    const target = pushbulletApi.buildTarget({
      deviceIden: deviceIden ?? undefined,
      email: email ?? undefined,
      channelTag: channelTag ?? undefined,
    });
    const push = await pushbulletApi.request<PushbulletPush>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/pushes',
      body: { type: 'note', title, body, ...target },
    });
    if (push.iden) {
      return push;
    }
    return { type: 'note', title, body, channel_tag: channelTag, sent_to_channel: true };
  },
});
