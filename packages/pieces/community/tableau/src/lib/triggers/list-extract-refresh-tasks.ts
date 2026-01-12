import { createTrigger, TriggerStrategy, PiecePropValueSchema, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders } from '../common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

function ensureString(body: any): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof tableauAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const tableauAuth = auth.props;
    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    const listTasksUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, 'tasks/extractRefreshes');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: listTasksUrl,
      headers: getTableauHeaders(authToken),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to list extract refresh tasks: ${response.status} - ${response.body}`);
    }

    const responseBody = ensureString(response.body);
    const tasks: any[] = [];

    const taskMatches = responseBody.matchAll(/<extractRefresh[^>]*id="([^"]+)"[^>]*priority="([^"]*)"[^>]*consecutiveFailedCount="([^"]*)"[^>]*type="([^"]*)"/g);

    for (const match of taskMatches) {
      const [, taskId, priority, consecutiveFailedCount, type] = match;

      const scheduleMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<schedule[^>]*id="([^"]*)"[^>]*name="([^"]*)"[^>]*state="([^"]*)"[^>]*priority="([^"]*)"[^>]*createdAt="([^"]*)"[^>]*updatedAt="([^"]*)"[^>]*type="([^"]*)"[^>]*frequency="([^"]*)"[^>]*nextRunAt="([^"]*)"`));
      
      let schedule = null;
      if (scheduleMatch) {
        const [, scheduleId, scheduleName, state, schedulePriority, createdAt, updatedAt, scheduleType, frequency, nextRunAt] = scheduleMatch;
        schedule = {
          id: scheduleId,
          name: scheduleName,
          state,
          priority: parseInt(schedulePriority),
          createdAt,
          updatedAt,
          type: scheduleType,
          frequency,
          nextRunAt,
        };
      } else {
        const cloudScheduleMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<schedule[^>]*frequency="([^"]*)"[^>]*nextRunAt="([^"]*)"`));
        if (cloudScheduleMatch) {
          const [, frequency, nextRunAt] = cloudScheduleMatch;
          schedule = {
            frequency,
            nextRunAt,
          } as any;

          const frequencyDetailsMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<frequencyDetails[^>]*start="([^"]*)"`));
          if (frequencyDetailsMatch) {
            const [, start] = frequencyDetailsMatch;
            (schedule as any).frequencyDetails = {
              start,
            };

            const intervalMatches = [...responseBody.matchAll(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>.*?<interval[^>]*>.*?<weekDay>([^<]+)</weekDay>`, 'gs'))];
            if (intervalMatches.length > 0) {
              (schedule as any).frequencyDetails.intervals = intervalMatches.map((m: RegExpMatchArray) => ({ weekDay: m[1] }));
            }
          }
        }
      }

      const workbookMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<workbook[^>]*id="([^"]+)"`));
      const datasourceMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<datasource[^>]*id="([^"]+)"`));

      const workbookId = workbookMatch ? workbookMatch[1] : null;
      const datasourceId = datasourceMatch ? datasourceMatch[1] : null;

      tasks.push({
        id: taskId,
        priority: parseInt(priority),
        consecutiveFailedCount: parseInt(consecutiveFailedCount),
        type,
        schedule,
        workbookId,
        datasourceId,
      });
    }

    return tasks.map((task) => ({
      id: task.id,
      data: task,
    }));
  },
};

export const listExtractRefreshTasksTrigger = createTrigger({
  name: 'list_extract_refresh_tasks',
  displayName: 'List Extract Refresh Tasks',
  description: 'Lists extract refresh tasks for the site',
  auth: tableauAuth,
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: '0ece2369-c4eb-4382-be0f-961039d708a0',
    priority: 50,
    consecutiveFailedCount: 5,
    type: 'RefreshExtractTask',
    schedule: {
      frequency: 'Weekly',
      nextRunAt: '2023-06-08T04:50:00Z',
      frequencyDetails: {
        start: '21:50:00',
        intervals: [
          { weekDay: 'Thursday' }
        ],
      },
    },
    workbookId: '7e766949-7166-4b3d-90ba-784f7575743b',
    datasourceId: null,
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
});

