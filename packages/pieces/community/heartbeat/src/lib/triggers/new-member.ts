import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatWebhooks } from '../common/webhooks';
import { heartbeatOutputSchemas } from '../common/output-schemas';
import { heartbeatUsers } from '../common/users';
import { heartbeatSamples } from '../common/samples';

export const newMemberTrigger = createTrigger({
  auth: heartbeatAuth,
  name: 'heartbeat_new_member',
  displayName: 'New Member Joined',
  description: 'Fires when a new member joins the community. Members added with Create User or Create Member do not fire it.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once when a person joins the Heartbeat community themselves (for example through an invitation link; members added through the API do not fire it) and returns their full member profile (ID, email, name, role, groups), re-read from Heartbeat so it cannot be forged.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: heartbeatSamples.user,
  outputSchema: heartbeatOutputSchemas.user,
  async onEnable(context) {
    await heartbeatWebhooks.enable({
      token: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      action: { name: 'USER_JOIN' },
    });
  },
  async onDisable(context) {
    await heartbeatWebhooks.disable({ token: context.auth.secret_text, store: context.store });
  },
  async test(context) {
    const users = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: context.auth.secret_text, method: HttpMethod.GET, path: '/users', operation: 'list members' }),
    );
    return [...users]
      .sort((a, b) => String(b['createdAt'] ?? '').localeCompare(String(a['createdAt'] ?? '')))
      .slice(0, 5);
  },
  async run(context) {
    const userId = heartbeatWebhooks.uuidOrNull(heartbeatWebhooks.payloadOf(context.payload.body)['id']);
    if (userId === null) {
      return [];
    }
    const user = await heartbeatWebhooks.fetchOrNull(() => heartbeatUsers.getUser({ token: context.auth.secret_text, userId }));
    if (user === null) {
      return [];
    }
    if (!(await heartbeatWebhooks.isFirstDelivery({ store: context.store, key: `USER_JOIN:${userId}` }))) {
      return [];
    }
    return [user];
  },
});
