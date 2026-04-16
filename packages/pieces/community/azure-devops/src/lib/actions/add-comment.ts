import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureDevOpsAuth } from '../common';
import { azureDevOpsCommon, IdentityRef } from '../common';

export const addCommentAction = createAction({
  auth: azureDevOpsAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Adds a comment to an existing work item in Azure DevOps',
  props: {
    project: azureDevOpsCommon.projectDropdown,
    work_item_id: Property.Number({
      displayName: 'Work Item ID',
      description: 'The ID of the work item to add a comment to (e.g. 123)',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text to add (supports HTML)',
      required: true,
    }),
  },
  async run(context) {
    const { project, work_item_id, comment } = context.propsValue;
    const auth = context.auth;
    const orgUrl = azureDevOpsCommon.sanitizeOrgUrl(auth.props.organizationUrl);

    const response = await azureDevOpsCommon.apiCall<CommentResponse>({
      organizationUrl: orgUrl,
      pat: auth.props.pat,
      method: HttpMethod.POST,
      endpoint: `/${encodeURIComponent(project)}/_apis/wit/workItems/${work_item_id}/comments`,
      queryParams: { 'api-version': '7.1-preview.4' },
      body: { text: comment },
    });

    return {
      id: response.id,
      work_item_id: response.workItemId,
      text: response.text ?? null,
      created_by: response.createdBy?.displayName ?? null,
      created_by_email: response.createdBy?.uniqueName ?? null,
      created_date: response.createdDate ?? null,
      modified_by: response.modifiedBy?.displayName ?? null,
      modified_date: response.modifiedDate ?? null,
    };
  },
});

interface CommentResponse {
  id: number;
  workItemId: number;
  text?: string;
  createdBy?: IdentityRef;
  createdDate?: string;
  modifiedBy?: IdentityRef;
  modifiedDate?: string;
}
