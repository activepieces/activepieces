import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { flowParserAuth } from '../common/auth';
import { templateDropdown } from '../common/props';
import dayjs from 'dayjs';

const BASE_URL = 'https://api.flowparser.one/v1';

const props = {
  templateId: templateDropdown,
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof flowParserAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { templateId } = propsValue;

    if (!templateId) {
      return [];
    }

    try {
      const queryParams: Record<string, string> = {
        status: 'parsed',
        template_id: templateId,
      };

      if (lastFetchEpochMS) {
        queryParams['since'] = new Date(lastFetchEpochMS).toISOString();
      }

      const response = await httpClient.sendRequest<
        Array<{
          id: string;
          status: string;
          [key: string]: any;
        }>
      >({
        method: HttpMethod.GET,
        url: `${BASE_URL}/documents/status-changes`,
        headers: {
          flow_api_key: auth.secret_text,
        },
        queryParams,
      });

      const statusChanges = Array.isArray(response.body) ? response.body : [];

      // Filter to only include parsed status changes for this template
      const parsedDocuments = statusChanges.filter(
        (doc) => doc.status === 'parsed'
      );

      return parsedDocuments.map((doc) => {
        // Use the status change timestamp or current time as fallback
        const timestamp = doc['updatedAt'] || doc['createdAt'] || new Date().toISOString();
        return {
          epochMilliSeconds: dayjs(timestamp).valueOf(),
          data: doc,
        };
      });
    } catch (error: any) {
      console.error('Error fetching parsed documents:', error);
      return [];
    }
  },
};

export const newParsedDocumentByTemplate = createTrigger({
  auth: flowParserAuth,
  name: 'new_parsed_document_by_template',
  displayName: 'New Parsed Document by Template',
  description: 'Triggers when a new document is parsed using a specific template',
  props,
  sampleData: {
    id: 'uuid',
    documentId: 'uuid',
    templateId: 'uuid',
    createdAt: '2024-01-01T00:00:00Z',
    parsedAt: '2024-01-01T00:00:00Z',
    status: 'parsed',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
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
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});

