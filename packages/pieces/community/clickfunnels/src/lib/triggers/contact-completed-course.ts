import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { clickfunnelsAuth } from '../common/constants';
import { teamsDropdown, workspacesDropdown } from '../common/props';
import { clickfunnelsApiService } from '../common/requests';

const CACHE_KEY = 'clickfunnels_contact_completed_course_trigger';
const MODULE_NAME = 'Contact Completed Course';

export const contactCompletedCourse = createTrigger({
  auth: clickfunnelsAuth,
  name: 'contactCompletedCourse',
  displayName: MODULE_NAME,
  description: 'Triggers when a contact completes a course.',
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ auth, webhookUrl, propsValue: { workspaceId }, store }) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required. Please select a workspace.');
    }

    try {
      const response: any = await clickfunnelsApiService.createWebhook(
        auth,
        workspaceId as string,
        {
          webhooks_outgoing_endpoint: {
            url: webhookUrl,
            name: `ActivePieces ${MODULE_NAME} Webhook - ${Date.now()}`,
            event_type_ids: ['courses/enrollment.course_completed'],
          },
        }
      );

      const webhookId = response.id;

      await store.put(CACHE_KEY, { webhookId });
    } catch (error) {
      console.error('Failed to create ClickFunnels webhook:', error);
      throw new Error(
        `Failed to create webhook: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
  async onDisable({ auth, store }) {
    const cachedData = (await store.get(CACHE_KEY)) as any;

    if (cachedData) {
      await clickfunnelsApiService
        .deleteWebhook(auth, cachedData.webhookId)
        .then(async () => {
          await store.delete(CACHE_KEY);
        });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
