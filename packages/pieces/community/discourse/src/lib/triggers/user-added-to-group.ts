import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseInput } from '../common/input';
import { discourseMap } from '../common/mappers';
import { discourseSchemas } from '../common/schemas';
import { discourseWebhook, WEBHOOK_INSTRUCTIONS } from '../common/webhook';

export const userAddedToGroupTrigger = createTrigger({
  auth: discourseAuth,
  name: 'user_added_to_group',
  classification: 'READ',
  displayName: 'User Added to Group',
  description: 'Triggers when a user joins or is added to a group.',
  aiMetadata: {
    description:
      'Fires once each time a user is added to a Discourse group, optionally only for one group ID, with the group and user IDs. Needs a global admin API key.',
  },
  props: {
    instructions: Property.MarkDown({ value: WEBHOOK_INSTRUCTIONS }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'Optional numeric group ID. Leave empty for all groups.',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'user_added_to_group',
    event_id: '105',
    group_id: 41,
    user_id: 7,
    owner: false,
    created_at: '2026-10-13T08:00:00.000Z',
  },
  outputSchema: discourseSchemas.webhookGroupUser,
  async onEnable(context) {
    discourseInput.optionalId({ value: context.propsValue.group_id, label: 'Group ID' });
    await discourseWebhook.enable({ auth: context.auth.props, webhookUrl: context.webhookUrl, store: context.store, events: ['user_added_to_group'] });
  },
  async onDisable(context) {
    await discourseWebhook.disable({ auth: context.auth.props, store: context.store });
  },
  async run(context) {
    const delivery = await discourseWebhook.receive({
      payload: context.payload,
      store: context.store,
      events: ['user_added_to_group'],
      nowMs: Date.now(),
    });
    if (delivery === undefined) {
      return [];
    }
    const record = discourseMap.rec(delivery.body['group_user'] ?? Object.values(delivery.body)[0]);
    const groupId = discourseMap.num(record['group_id']);
    const wanted = discourseInput.optionalId({ value: context.propsValue.group_id, label: 'Group ID' });
    if (wanted !== undefined && String(groupId) !== wanted) {
      return [];
    }
    return [
      {
        event: delivery.event,
        event_id: delivery.eventId,
        group_id: groupId,
        user_id: discourseMap.num(record['user_id']),
        owner: discourseMap.bool(record['owner']),
        created_at: discourseMap.str(record['created_at']),
      },
    ];
  },
});
