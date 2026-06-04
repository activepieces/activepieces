import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, extractItems, flattenCustomFields, getAuth } from '../common';

export function buildPolling(
  path: string,
  timestampField: string,
): Polling<AppConnectionValueForAuthProperty<typeof ninjapipeAuth>, Record<string, never>> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
      const a = getAuth({ auth });
      const response = await ninjapipeApiCall<{ data?: unknown[] }>({
        auth: a,
        method: HttpMethod.GET,
        path,
        queryParams: { limit: '100', sort: timestampField, order: 'desc' },
      });
      const items = extractItems(response.body);
      return items.map((item) => {
        const record = item as Record<string, unknown>;
        const ts = (record[timestampField] ?? record['created_at'] ?? record['updated_at']) as
          | string
          | number
          | undefined;
        return {
          epochMilliSeconds: ts ? new Date(ts).getTime() : Date.now(),
          data: flattenCustomFields(record),
        };
      });
    },
  };
}

export function buildProjectTasksPolling(
  timestampField: 'created_at' | 'updated_at',
): Polling<AppConnectionValueForAuthProperty<typeof ninjapipeAuth>, { projectId: string }> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
      const projectId = propsValue.projectId;
      if (!projectId) return [];
      const a = getAuth({ auth });
      const response = await ninjapipeApiCall<{ data?: unknown[] }>({
        auth: a,
        method: HttpMethod.GET,
        path: `/projects/${projectId}/tasks`,
        queryParams: { sort_by: timestampField, sort_order: 'desc' },
      });
      const items = extractItems(response.body);
      return items.map((item) => {
        const record = item as Record<string, unknown>;
        const ts = (record[timestampField] ?? record['created_at'] ?? record['updated_at']) as
          | string
          | number
          | undefined;
        return {
          epochMilliSeconds: ts ? new Date(ts).getTime() : Date.now(),
          data: flattenCustomFields(record),
        };
      });
    },
  };
}
