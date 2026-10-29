import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const getCampaigns = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_campaigns',
  classification: 'SEARCH',
  displayName: 'Find Campaign',
  description: 'Finds campaigns by name, status or tags.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Tarvent campaigns whose name contains the given text, that have any of the given comma-separated tags, and/or that are in a status (COMPLETED = sent, READY_TO_SEND, NOT_SCHEDULED = draft, PENDING = scheduled, Paused, STOPPED, SENDING_PENDING_AB_WINNER), newest first; empty filters return all campaigns. Returns up to 50 per call with totalCount, hasMore and nextCursor. Use to get a campaign ID for Get Campaign Stats. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.campaignPage,
  props: {
    name: Property.ShortText({ displayName: 'Campaign name', description: 'Find campaigns whose name contains this text.', required: false }),
    tags: Property.LongText({ displayName: 'Campaign tags', description: 'Find campaigns with any of these tags. Separate multiple tags with a comma.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Campaign status',
      required: false,
      options: {
        options: [
          { label: 'Sent', value: 'COMPLETED' },
          { label: 'Ready to send', value: 'READY_TO_SEND' },
          { label: 'Draft', value: 'NOT_SCHEDULED' },
          { label: 'Scheduled', value: 'PENDING' },
          { label: 'Paused', value: 'Paused' },
          { label: 'Stopped', value: 'STOPPED' },
          { label: 'Pending multivariate winner', value: 'SENDING_PENDING_AB_WINNER' },
        ],
      },
    }),
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    const { name, tags, status } = context.propsValue;
    return tarventClient.listPage({
      auth: context.auth.props,
      operation: 'FindCampaigns',
      field: 'campaigns',
      selection: tarventClient.fields.campaign,
      argDefs: ', $order: [CampaignInfoSortInput!], $where: CampaignInfoFilterInput',
      args: ', order: $order, where: $where',
      variables: { order: [{ modifiedUtc: 'DESC' }], where: tarventClient.campaignWhere({ name, tags, status }) },
      first: tarventCommon.pageLimit(context.propsValue.limit),
      after: tarventCommon.trimmed(context.propsValue.cursor),
      withTotalCount: true,
    });
  },
});
