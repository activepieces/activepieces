import { createAction } from '@activepieces/pieces-framework';

export const createApprovalLink = createAction({
  name: 'create_approval_links',
  displayName: 'Create Approval Links',
  description:
    'Create links only without pausing the flow, use wait for approval to pause',
  props: {},
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async run(ctx) {
    return {
      approvalLink: ctx.generateResumeUrl({
        queryParams: { action: 'approve' },
      }),
      disapprovalLink: ctx.generateResumeUrl({
        queryParams: { action: 'disapprove' },
      }),
    };
  },
});
