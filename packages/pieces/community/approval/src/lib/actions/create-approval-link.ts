import { createAction, Property, PropertyType } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

export const createApprovalLink = createAction({
  name: 'create_approval_links',
  displayName: 'Create Approval Links',
  description:
    'Create links only without pausing the flow, use wait for approval to pause',
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.WARNING,
      value: 'Please use Manual Task feature instead from 0.48.0 and above',
    }),
  },
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
