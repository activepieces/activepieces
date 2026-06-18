import { createAction } from "@activepieces/pieces-framework";
import { getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { clickupCommon, listAccessibleCustomFields } from "../../common"
import { clickupAuth } from '../../auth';

export const getClickupAccessibleCustomFields = createAction({
  auth: clickupAuth,
  name: 'get_accessible_custom_fields',
  displayName: 'Get Accessible Custom Fields',
  description: 'View the Custom Fields available on tasks in a specific List.',
  audience: 'both',
  aiMetadata: { description: 'Read-only: list the custom fields defined for tasks in a given ClickUp list, including each field ID, type, and configuration. Use this to discover valid field IDs before setting a custom field value on a task. Safe to call repeatedly.', idempotent: true },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    space_id: clickupCommon.space_id(true),
    list_id: clickupCommon.list_id(true)
  },
  async run(configValue) {
    const { list_id } = configValue.propsValue;
    const auth = getAccessTokenOrThrow(configValue.auth)

    return (await listAccessibleCustomFields(auth, list_id as unknown as string)).fields
  }
})