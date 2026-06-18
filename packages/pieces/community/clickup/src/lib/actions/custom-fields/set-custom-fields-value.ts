import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { callClickUpApi, clickupCommon } from "../../common"
import { clickupAuth } from '../../auth';

export const setClickupCustomFieldValue = createAction({
  auth: clickupAuth,
  name: 'set_custom_fields_value',
  displayName: 'Set Custom Field Value',
  description: 'Add data to a Custom field on a task.',
  audience: 'both',
  aiMetadata: { description: 'Set the value of a specific custom field on a ClickUp task, given the task ID and field ID. This overwrites the field with the supplied value, so repeating with the same value leaves the task in the same state (upsert by field). Use get-accessible-custom-fields first to find the field ID and its expected value format.', idempotent: true },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    space_id: clickupCommon.space_id(true),
    list_id: clickupCommon.list_id(false),
    task_id: clickupCommon.task_id(true),
    field_id: clickupCommon.field_id(true),
    value: Property.LongText({
      displayName: "Value",
      description: "The new value to be set",
      required: true
    })
  },
  async run(configValue) {
    const { field_id, task_id, value } = configValue.propsValue;

    const response = await callClickUpApi<Record<string, unknown>>(
      HttpMethod.POST,
      `task/${task_id}/field/${field_id}`, 
      getAccessTokenOrThrow(configValue.auth), 
      { value: value }
    );

    return response.body
  }
})