import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

const INTERACTION_TYPES = [
  'call', 'meeting', 'message', 'coffee', 'lunch', 'event', 'drink',
  'whatsapp', 'twitter', 'linkedin', 'instagram', 'hangout', 'tiktok', 'skype', 'slack',
  'iMessage', 'fbMessenger', 'signal', 'discord', 'wechat', 'telegram', 'viber',
];

export const logInteraction = createAction({
  auth: folkAuth,
  name: 'log_interaction',
  displayName: 'Log Interaction',
  description: 'Log a call, meeting, message or other interaction on a Folk person or company.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: folkOutputSchemas.interaction,
  aiMetadata: {
    description:
      'Logs a past interaction (call, meeting, message, coffee, lunch, event, drink, or a channel such as linkedin, whatsapp, slack) on a Folk person (per_...) or company (com_...), with a title, content and date-time; it updates their last-interaction stats. Folk marks this API as beta. Each call adds an entry; pass an Idempotency Key so a retry returns the first one.',
    idempotent: false,
  },
  props: {
    entityId: folkAi.idProp({ displayName: 'Record ID', description: 'ID of the person (per_...) or company (com_...).' }),
    title: Property.ShortText({ displayName: 'Title', description: 'Short title, e.g. "Intro call".', required: true }),
    content: Property.LongText({ displayName: 'Content', description: 'What happened.', required: true }),
    dateTime: Property.ShortText({ displayName: 'Date and Time', description: 'When it happened, ISO 8601. Defaults to now.', required: false }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Kind of interaction. Defaults to call.',
      required: false,
      options: { options: INTERACTION_TYPES.map((value) => ({ label: value, value })) },
    }),
    idempotencyKey: folkAi.idempotencyKeyProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const id = folkClient.idSegment({ value: p.entityId, label: 'Record ID' });
    if (!/^(per|com)_/.test(id)) {
      throw new Error('Record ID must be a person (per_...) or company (com_...) ID.');
    }
    const title = folkFields.textValue({ value: p.title });
    const content = folkFields.textValue({ value: p.content });
    if (title === undefined || content === undefined) {
      throw new Error('Title and Content are required.');
    }
    const type = folkFields.textValue({ value: p.type }) ?? 'call';
    if (!INTERACTION_TYPES.includes(type)) {
      throw new Error(`Type must be one of: ${INTERACTION_TYPES.join(', ')}.`);
    }
    return folkClient.sendData<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/interactions',
      body: {
        entity: { id },
        title,
        content,
        dateTime: folkFields.dateTimeValue({ value: p.dateTime, label: 'Date and Time' }) ?? new Date().toISOString(),
        type,
      },
      idempotencyKey: folkFields.idempotencyKeyValue({ value: p.idempotencyKey }),
    });
  },
});
