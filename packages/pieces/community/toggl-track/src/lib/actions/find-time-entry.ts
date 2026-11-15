import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTimeEntry } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const findTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'find_time_entry',
  classification: 'SEARCH',
  displayName: 'Find Time Entry',
  description: 'Find time entries by description.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the current user\'s time entries, optionally bounded by dates and filtered by description text. Agents: use Time Summary (Agent) for totals. On Toggl 2.0 the last 9 days are searched when no dates are given. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.optional_workspace_id,
    description: Property.ShortText({
      displayName: 'Description Contains',
      description:
        'Search for time entries containing this text in description.',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description:
        'Get entries from start_date (YYYY-MM-DD or RFC3339 format).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Get entries until end_date (YYYY-MM-DD or RFC3339 format).',
      required: false,
    }),
    before: Property.ShortText({
      displayName: 'Before Date',
      description:
        'Get entries before given date (YYYY-MM-DD or RFC3339 format).',
      required: false,
    }),
    since: Property.Number({
      displayName: 'Since Timestamp',
      description:
        'Entries modified since this UNIX timestamp (range start on Toggl 2.0).',
      required: false,
    }),
    meta: Property.Checkbox({
      displayName: 'Include Meta Data',
      description:
        'Include meta entity data. Toggl Track (Classic) only.',
      required: false,
      defaultValue: false,
    }),
    include_sharing: Property.Checkbox({
      displayName: 'Include Sharing',
      description:
        'Include sharing details in the response. Toggl Track (Classic) only.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: togglOutputSchemas.timeEntryList,
  async run(context) {
    const {
      description,
      start_date,
      end_date,
      before,
      since,
      meta,
      include_sharing,
    } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.optionalId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const search = description?.trim().toLowerCase();
    const matches = (entryDescription: string | null | undefined) =>
      search ? (entryDescription ?? '').toLowerCase().includes(search) : true;

    if (togglApi.isTwo(auth)) {
      const targetWorkspaceId =
        workspaceId ?? (await togglApi.twoSettings(auth)).current_workspace_id;
      const rangeEnd = end_date ?? before;
      const dateTo = rangeEnd
        ? togglApi.toIsoDateTime({
            value: rangeEnd,
            label: end_date ? 'End Date' : 'Before Date',
          })
        : new Date().toISOString();
      const dateFrom = twoRangeStart({ start_date, since });
      const [userAccountId, entries] = await Promise.all([
        togglApi.twoCurrentUserAccountId(auth),
        togglApi.listTwoPages<TwoTimeEntry>({
          auth,
          path: togglApi.twoWorkspacePath({
            auth,
            workspaceId: targetWorkspaceId,
            path: '/time-entries',
          }),
          queryParams: {
            date_from: dateFrom,
            date_to: dateTo,
            include_taskless: 'true',
          },
        }),
      ]);
      return entries
        .filter(togglModels.isTracked)
        .filter((entry) =>
          isNil(userAccountId) ? true : entry.toggl_user_id === userAccountId
        )
        .filter((entry) => matches(entry.description))
        .map((entry) => togglModels.timeEntry({ item: entry, running: false }));
    }

    const queryParams: QueryParams = {};
    if (start_date) queryParams['start_date'] = start_date;
    if (end_date) queryParams['end_date'] = end_date;
    if (before) queryParams['before'] = before;
    if (!isNil(since)) queryParams['since'] = since.toString();
    if (!isNil(meta)) queryParams['meta'] = meta.toString();
    if (!isNil(include_sharing))
      queryParams['include_sharing'] = include_sharing.toString();

    const response = await togglApi.request<
      { id: number; workspace_id?: number; description: string | null }[] | null
    >({
      auth,
      method: togglApi.HttpMethod.GET,
      path: '/me/time_entries',
      queryParams,
    });
    const timeEntries = Array.isArray(response) ? response : [];
    return timeEntries
      .filter((entry) =>
        isNil(workspaceId) ? true : entry.workspace_id === workspaceId
      )
      .filter((entry) => matches(entry.description));
  },
});

const DEFAULT_TWO_RANGE_MS = 9 * 24 * 60 * 60 * 1000;

function twoRangeStart({
  start_date,
  since,
}: {
  start_date: string | undefined;
  since: number | undefined;
}): string {
  if (start_date) {
    return togglApi.toIsoDateTime({ value: start_date, label: 'Start Date' });
  }
  if (!isNil(since)) {
    return new Date(since * 1000).toISOString();
  }
  return new Date(Date.now() - DEFAULT_TWO_RANGE_MS).toISOString();
}
