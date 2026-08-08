import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateSpaceTag = createAction({
  auth: clickupAuth,
  name: 'clickup_create_space_tag',
  description: 'Create a new tag in a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new tag in a ClickUp space with a name and optional foreground/background colors. Use this before Add Tag To Task when the tag does not yet exist; to rename or recolor an existing tag use Update Space Tag instead. Creating a tag whose name already exists may fail, so it is not idempotent.',
    idempotent: false,
  },
  displayName: 'Create Space Tag',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    name: Property.ShortText({
      description: 'The name of the new tag',
      displayName: 'Tag Name',
      required: true,
    }),
    tag_fg: Property.ShortText({
      description: 'Foreground (text) color as a hex value, e.g. #FFFFFF',
      displayName: 'Foreground Color',
      required: false,
    }),
    tag_bg: Property.ShortText({
      description: 'Background color as a hex value, e.g. #000000',
      displayName: 'Background Color',
      required: false,
    }),
  },
  async run(configValue) {
    const { space_id, name, tag_fg, tag_bg } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.POST,
      `space/${space_id}/tag`,
      getAccessTokenOrThrow(configValue.auth),
      {
        tag: {
          name,
          tag_fg: tag_fg ?? undefined,
          tag_bg: tag_bg ?? undefined,
        },
      }
    );

    return response.body;
  },
});
