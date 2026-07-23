import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateChecklist = createAction({
  auth: clickupAuth,
  name: 'clickup_update_checklist',
  description: 'Rename or reposition a checklist in ClickUp',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename a ClickUp checklist or change its position, identified by its checklist ID (obtained from Create Checklist or the task data). To edit the items inside it use Update Checklist Item instead. This sets the checklist to the supplied end state, so repeating the same update is idempotent.',
    idempotent: true,
  },
  displayName: 'Update Checklist',
  props: {
    checklist_id: Property.ShortText({
      description: 'The ID of the checklist to update (from Create Checklist)',
      displayName: 'Checklist ID',
      required: true,
    }),
    name: Property.ShortText({
      description: 'The new name of the checklist',
      displayName: 'Checklist Name',
      required: false,
    }),
    position: Property.Number({
      description:
        'The zero-based position of the checklist relative to other checklists on the task',
      displayName: 'Position',
      required: false,
    }),
  },
  async run(configValue) {
    const { checklist_id, name, position } = configValue.propsValue;

    const body: Record<string, unknown> = {};
    if (name !== undefined && name !== null && name !== '') {
      body['name'] = name;
    }
    if (position !== undefined && position !== null) {
      body['position'] = position;
    }

    const response = await callClickUpApi(
      HttpMethod.PUT,
      `checklist/${checklist_id}`,
      getAccessTokenOrThrow(configValue.auth),
      body
    );

    return response.body;
  },
});
