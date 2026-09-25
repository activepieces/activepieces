import { createAction } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { GraphPermission, createMSGraphClientFromAuth, getItemPath, toPermissionSummary } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelListWorkbookPermissions = createAction({
  auth: excelAuth,
  name: 'excel_list_workbook_permissions',
  classification: 'SEARCH',
  displayName: 'List Workbook Permissions',
  description: 'List who has access to a workbook, including sharing links.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the permissions on a workbook file: owner, per-person grants, sharing links and access inherited from parent folders. Use it to check who can open or edit a workbook before or after excel_share_workbook. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
  },
  async run(context) {
    const response: { value?: GraphPermission[] } = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getItemPath(context.propsValue)}/permissions`)
      .get();
    const permissions = (response.value ?? []).map(toPermissionSummary);
    return { permissions, count: permissions.length };
  },
});
