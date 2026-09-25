import { createAction } from '@activepieces/pieces-framework';
import { WorkbookComment } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getWorkbookPath } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListComments = createAction({
  auth: excelAuth,
  name: 'excel_list_comments',
  classification: 'SEARCH',
  displayName: 'List Comments',
  description: 'List the comments in a workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the threaded comments in a workbook with their text and content type. Use to review feedback left on a spreadsheet; cell values are read with excel_get_range instead. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
  },
  async run(context) {
    const response: { value?: WorkbookComment[] } = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getWorkbookPath(context.propsValue)}/comments`)
      .get();
    const comments = (response.value ?? []).map((comment) => ({
      id: comment.id ?? null,
      content: comment.content ?? null,
      contentType: comment.contentType ?? null,
      replyCount: comment.replies ? comment.replies.length : null,
    }));
    return { comments, count: comments.length };
  },
});
