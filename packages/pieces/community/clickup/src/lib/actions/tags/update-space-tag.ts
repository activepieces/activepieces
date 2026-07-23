import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi, listTags } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateSpaceTag = createAction({
  auth: clickupAuth,
  name: 'clickup_update_space_tag',
  description: 'Rename or recolor an existing tag in a ClickUp space',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename or recolor an existing ClickUp space tag, identified by its current name. Use List Space Tags to find the current name; to add a brand-new tag use Create Space Tag instead. This sets the tag to the supplied end state, so repeating the same update is idempotent.',
    idempotent: true,
  },
  displayName: 'Update Space Tag',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    tag_name: Property.Dropdown({
      auth: clickupAuth,
      displayName: 'Tag',
      description: 'The current name of the tag to update',
      required: true,
      refreshers: ['space_id'],
      options: async ({ auth, space_id }) => {
        if (!auth || !space_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select a space',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listTags(accessToken, space_id as string);
        return {
          disabled: false,
          options: response.tags.map((tag) => {
            return {
              label: tag.name,
              value: tag.name,
            };
          }),
        };
      },
    }),
    new_name: Property.ShortText({
      description: 'The new name for the tag',
      displayName: 'New Name',
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
    const { space_id, tag_name, new_name, tag_fg, tag_bg } =
      configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.PUT,
      `space/${space_id}/tag/${encodeURIComponent(tag_name as string)}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        tag: {
          name: new_name,
          tag_fg: tag_fg ?? undefined,
          tag_bg: tag_bg ?? undefined,
        },
      }
    );

    return response.body;
  },
});
