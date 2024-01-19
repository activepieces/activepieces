import { createAction } from '@activepieces/pieces-framework';

export const createApprovalLink = createAction({
  name: 'create_approval_links',
  displayName: 'Create Approval Links',
  description:
    'Create links only without pausing the flow, use wait for approval to pause',
  props: {},
  async run(ctx) {
    return {
      approvalLink: `${ctx.serverUrl}v1/flow-runs/${ctx.run.id}/resume?action=approve`,
      disapprovalLink: `${ctx.serverUrl}v1/flow-runs/${ctx.run.id}/resume?action=disapprove`,
    };
  },
});
