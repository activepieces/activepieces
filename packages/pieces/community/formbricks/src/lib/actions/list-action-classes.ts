import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksSchemas } from '../common/schemas';

export const listActionClassesAction = createAction({
  auth: formBricksAuth,
  name: 'list_action_classes',
  classification: 'SEARCH',
  displayName: 'List Actions',
  description: 'Lists the user actions (action classes) that can trigger in-app surveys.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Formbricks action classes, the tracked user actions (code, noCode, automatic) that can trigger app surveys, with name, key and workspaceId. Optional workspaceId filter. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Only actions of this workspace. Leave empty for all.',
      required: false,
    }),
  },
  outputSchema: formbricksSchemas.listActionClasses,
  async run({ auth, propsValue }) {
    const actionClasses = await formbricksApi.listActionClasses({ auth, workspaceId: formbricksInputs.optionalString(propsValue.workspaceId) });
    return { actionClasses, count: actionClasses.length };
  },
});
