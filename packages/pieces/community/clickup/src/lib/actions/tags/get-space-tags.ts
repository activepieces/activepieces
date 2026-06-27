import { createAction } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, listTags } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetSpaceTags = createAction({
  auth: clickupAuth,
  name: 'clickup_get_space_tags',
  description: 'List all tags defined in a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: list every tag defined in a ClickUp space. Use this to discover valid tag names before calling Add Tag To Task, Remove Tag From Task, Update Space Tag, or Delete Space Tag. Safe to call repeatedly.',
    idempotent: true,
  },
  displayName: 'List Space Tags',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
  },
  async run(configValue) {
    const { space_id } = configValue.propsValue;
    return await listTags(
      getAccessTokenOrThrow(configValue.auth),
      space_id as string
    );
  },
});
