import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { autocallsAuth, baseApiUrl } from '../..';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<any>, { start?: string; end?: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: baseApiUrl + 'api/user/assistants',
      headers: {
        Authorization: 'Bearer ' + auth,
      },
    });

    if (res.status !== 200) {
      throw new Error(`Failed to fetch assistants. Status: ${res.status}`);
    }

    const assistants =
      (res.body as Array<{
        id: number;
        created_at: string;
        updated_at: string;
      }>) || [];

    const filteredAssistants = assistants.filter((assistant) => {
      const assistantDate = assistant.created_at
        ? dayjs(assistant.created_at)
        : dayjs(assistant.updated_at);

      // Check start date filter
      if (propsValue['start']) {
        const startDate = dayjs(propsValue['start']);
        if (assistantDate.isBefore(startDate)) {
          return false;
        }
      }

      // Check end date filter
      if (propsValue['end']) {
        const endDate = dayjs(propsValue['end']);
        if (assistantDate.isAfter(endDate)) {
          return false;
        }
      }

      return true;
    });

    return filteredAssistants.map((assistant) => {
      const assistantDate = assistant.created_at
        ? dayjs(assistant.created_at)
        : dayjs(assistant.updated_at);
      return {
        epochMilliSeconds: assistantDate.valueOf(),
        data: assistant,
      };
    });
  },
};

export const getAssistants = createTrigger({
    auth:autocallsAuth,
name: 'getAssistants',
    displayName: 'Updated Assistant',
    description: 'Triggers when assistants are fetched or updated in your Autocalls account.',
props: {
        start: Property.DateTime({
            displayName: 'Start Date',
            description: 'Filter assistants created after this date. Example: 2024-01-15T10:30:00Z',
            required: false,
        }),
        end: Property.DateTime({
            displayName: 'End Date', 
            description: 'Filter assistants created before this date. Example: 2024-12-31T23:59:59Z',
            required: false,
        }),
    },
    sampleData: {
        id: "assistant_123",
        name: "Customer Support Assistant",
        description: "Handles customer inquiries and support requests",
        status: "active",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T14:20:00Z",
        settings: {
            voice: "en-US-female",
            language: "en-US",
            max_duration: 300
        }
    },
type: TriggerStrategy.POLLING,
async test(context) {
    return await pollingHelper.test(polling, context);
},
async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
},
async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
},
async run(context) {
    return await pollingHelper.poll(polling, context);
},
});
