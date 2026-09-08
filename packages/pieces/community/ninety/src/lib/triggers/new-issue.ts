import { isNil, spreadIfDefined } from '@activepieces/pieces-framework';
import { ninetyCommon, NinetyIssue } from '../common/client';
import { ninetyProps } from '../common/props';
import { issueTriggerOutputSchema } from '../common/output-schemas';
import { SAMPLE_ISSUE } from '../common/samples';
import { createNinetyPollingTrigger } from './create-polling-trigger';

const ISSUE_PAGE_SIZE = 100;
const ISSUE_MAX_PAGES = 50;

export const newIssue = createNinetyPollingTrigger({
  name: 'new_issue',
  displayName: 'New Issue',
  description: 'Fires when an issue is raised in Ninety',
  aiDescription:
    'Fires once for each new Ninety issue, carrying the whole issue: its id, title, description, priority, team and term. Ninety has no webhooks, so this polls and only sees issues raised since the last check.',
  props: {
    teamId: ninetyProps.teamIdOptional,
    intervalCode: ninetyProps.intervalCode,
  },
  outputSchema: issueTriggerOutputSchema,
  sampleData: SAMPLE_ISSUE,
  fetchRecords: async ({ token, propsValue, since }) => {
    const filters = {
      sortField: 'createdDate',
      sortDirection: 'DESC',
      pageSize: ISSUE_PAGE_SIZE,
      ...spreadIfDefined('teamId', propsValue.teamId),
      ...spreadIfDefined('intervalCode', propsValue.intervalCode),
    };
    const collected: NinetyIssue[] = [];
    for (let pageIndex = 0; pageIndex < ISSUE_MAX_PAGES; pageIndex++) {
      const { items } = await ninetyCommon.queryIssues({
        token,
        query: { ...filters, pageIndex },
      });
      collected.push(...items);
      if (items.length < ISSUE_PAGE_SIZE || since <= 0) {
        break;
      }
      if (reachesPast({ record: items[items.length - 1], since })) {
        break;
      }
    }
    return collected;
  },
});

function reachesPast({
  record,
  since,
}: {
  record: NinetyIssue;
  since: number;
}): boolean {
  if (isNil(record?.createdDate)) {
    return true;
  }
  const epoch = new Date(record.createdDate).getTime();
  return Number.isNaN(epoch) || epoch <= since;
}
