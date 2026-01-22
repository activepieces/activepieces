import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { seekTableAuth } from '../../lib/common/auth';
import { seekTableApiCall } from '../../lib/common/client';

interface Report {
  Id: string;
  Name: string;
  ReportType: string;
  Config: string;
  CreateDate?: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof seekTableAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await seekTableApiCall({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: 'api/report',
    }) as Report[];

    // Map all reports to polling format
    // Note: If CreateDate is not available, we'll use current time for new reports
    return response.map((report) => ({
      epochMilliSeconds: report.CreateDate ? Date.parse(report.CreateDate) : Date.now(),
      data: report,
    }));
  },
};

export const newReportTrigger = createTrigger({
  auth: seekTableAuth,
  name: 'new_report',
  displayName: 'New Report',
  description: 'Triggers when a new report is added to your SeekTable account.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    Id: "edb1ee25d81c4acd96d2c9d0f819afde",
    Name: "Total by Year",
    ReportType: "pivot",
    Config: "{report_JSON_config}"
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
