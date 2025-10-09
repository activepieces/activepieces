import {
  AuthenticationType,
  DedupeStrategy,
  HttpMethod,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import {
  elementTypeProperty,
  instanceLogin,
  prepareHttpRequest,
} from '../common';
import dayjs from 'dayjs';

export const newOrUpdatedRecord = createTrigger({
  auth: vtigerAuth,
  name: 'new_or_updated_record',
  displayName: 'New or Updated Record',
  description:
    'Triggers when a new record is introduced or a record is updated.',
  props: {
    elementType: elementTypeProperty,
    watchBy: Property.StaticDropdown({
      displayName: 'Watch By',
      description: 'Column to watch for trigger',
      required: true,
      options: {
        options: [
          { value: 'createdtime', label: 'Created Time' },
          { value: 'modifiedtime', label: 'Modified Time' },
        ],
      },
    }),
    syncType: Property.StaticDropdown({
      displayName: 'Sync Scope',
      description: 'Records visibility scope for sync',
      required: false,
      options: {
        options: [
          { value: 'application', label: 'Application (all records)' },
          { value: 'userandgroup', label: "User's groups" },
          { value: 'user', label: 'User only' },
        ],
      },
      defaultValue: 'application',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Enter the maximum number of records to return.',
      defaultValue: 100,
      required: true,
    }),
  },
  sampleData: {
    success: true,
    result: [
      {
        id: '3x291',
        createdtime: '2020-07-22 12:46:55',
        modifiedtime: '2020-07-22 12:46:55',
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, { ...ctx });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, { ...ctx });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, { ...ctx });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, { ...ctx });
  },
});

const polling: Polling<
  PiecePropValueSchema<typeof vtigerAuth>,
  { elementType?: string; watchBy?: string; limit?: number; syncType?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await fetchRecords({ auth, propsValue, lastFetchEpochMS });

    return (items ?? []).map((item) => {
      return {
        epochMilliSeconds: dayjs(
          propsValue.watchBy === 'createdtime'
            ? item['createdtime']
            : item['modifiedtime']
        ).valueOf(),
        data: item,
      };
    });
  },
};

const fetchRecords = async ({
  auth,
  propsValue,
  lastFetchEpochMS,
}: {
  auth: Record<string, string>;
  propsValue: Record<string, unknown>;
  lastFetchEpochMS: number;
}) => {
  const elementType = propsValue['elementType'] as string;
  const limit = (propsValue['limit'] as number) ?? 100;
  const syncType = (propsValue['syncType'] as string) ?? 'application';

  const baseUrl = `${auth['instance_url']}/restapi/v1/vtiger/default`;

  // Vtiger expects UNIX timestamp (seconds)
  let modifiedTimeSec = Math.floor((lastFetchEpochMS || 0) / 1000);

  const updatedIds: string[] = [];
  let more = true;
  let safety = 0;

  while (more && updatedIds.length < limit && safety < 10) {
    const syncResp = await httpClient.sendRequest<{
      success: boolean;
      result: { updated: string[]; deleted: string[]; more: boolean; lastModifiedTime: number };
    }>({
      method: HttpMethod.GET,
      url: `${baseUrl}/sync`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth['username'],
        password: auth['password'],
      },
      queryParams: {
        modifiedTime: String(modifiedTimeSec),
        elementType,
        syncType,
      },
    });

    if (!syncResp.body?.success) break;

    const res = syncResp.body.result;
    more = res.more === true;
    modifiedTimeSec = res.lastModifiedTime || modifiedTimeSec;

    for (const id of res.updated ?? []) {
      if (updatedIds.length < limit) updatedIds.push(id);
    }

    safety++;
  }

  if (updatedIds.length === 0) return [];

  const idsToFetch = updatedIds.slice(0, limit);

  const results: Record<string, any>[] = [];
  for (const id of idsToFetch) {
    const retrieveResp = await httpClient.sendRequest<{
      success: boolean;
      result: Record<string, any>;
    }>({
      method: HttpMethod.GET,
      url: `${baseUrl}/retrieve`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth['username'],
        password: auth['password'],
      },
      queryParams: {
        id,
      },
    });

    if (retrieveResp.body?.success && retrieveResp.body.result) {
      results.push(retrieveResp.body.result);
    }
  }

  return results;
};
