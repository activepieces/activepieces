import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';
import { spaceOutputSchema } from '../../output-schemas';

export const clickupUpdateSpace = createAction({
  auth: clickupAuth,
  name: 'clickup_update_space',
  classification: 'WRITE',
  description: 'Update an existing ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update properties of an existing ClickUp space (such as renaming it or toggling multiple-assignee support) by space ID. Pick this to modify a space you already have the ID for; use Create Space to make a new one. Only the fields you supply are changed, so repeating the same update yields the same end state.',
    idempotent: true,
  },
  displayName: 'Update Space',
  outputSchema: spaceOutputSchema,
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    name: Property.ShortText({
      description: 'The new name for the space',
      displayName: 'Space Name',
      required: false,
    }),
    multiple_assignees: clickupCommon.optionalBoolean({
      displayName: 'Multiple Assignees',
      description:
        'Allow tasks in this space to have multiple assignees. Leave empty or pick Leave unchanged to keep the current setting.',
    }),
  },
  async run(configValue) {
    const { space_id, name } = configValue.propsValue;
    const accessToken = getAccessTokenOrThrow(configValue.auth);
    const multiple_assignees =
      clickupCommon.optionalBooleanValue(
        configValue.propsValue.multiple_assignees
      ) ??
      (await currentMultipleAssignees({
        accessToken,
        spaceId: String(space_id),
      }));
    const body: Record<string, unknown> = { multiple_assignees };
    if (name !== undefined) body['name'] = name;
    const response = await callClickUpApi(
      HttpMethod.PUT,
      `space/${space_id}`,
      accessToken,
      body
    );

    return response.body;
  },
});

async function currentMultipleAssignees({
  accessToken,
  spaceId,
}: {
  accessToken: string;
  spaceId: string;
}): Promise<boolean> {
  const response = await callClickUpApi<{ multiple_assignees: boolean }>(
    HttpMethod.GET,
    `space/${spaceId}`,
    accessToken,
    undefined
  );
  return response.body.multiple_assignees;
}
