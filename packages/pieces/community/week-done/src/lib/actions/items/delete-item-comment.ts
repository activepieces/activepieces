import { HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { weekdoneAuth } from '../../../index';
import {
  weekdoneApiCall,
  weekdoneItemCommentsDropdown,
  weekdoneItemsDropdown,
  weekdoneTeamsDropdown,
  weekdoneUsersDropdown,
} from '../../common';

export const deleteItemCommentAction = createAction({
  auth: weekdoneAuth,
  name: 'delete_item_comment',
  displayName: 'Delete Item Comment',
  description: 'Delete a comment from an item.',
  props: {
    user_id_filter: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'User (Filter)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const state = await weekdoneUsersDropdown(auth as OAuth2PropertyValue);
        return {
          ...state,
          options: [{ label: 'Me', value: 'me' as any }, ...state.options],
        };
      },
    }),
    team_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'Team (Filter)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        return weekdoneTeamsDropdown(auth as OAuth2PropertyValue);
      },
    }),
    period: Property.ShortText({
      displayName: 'Period (Filter)',
      required: false,
    }),
    item_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'Item',
      required: true,
      refreshers: ['user_id_filter', 'team_id', 'period'],
      options: async ({ auth, user_id_filter, team_id, period }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        return weekdoneItemsDropdown(auth as OAuth2PropertyValue, {
          userId: user_id_filter as any,
          teamId: team_id ? Number(team_id) : undefined,
          period: period as string | undefined,
        });
      },
    }),
    comment_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'Comment',
      required: true,
      refreshers: ['item_id'],
      options: async ({ auth, item_id }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        if (!item_id) {
          return {
            disabled: true,
            placeholder: 'Select an item first',
            options: [],
          };
        }
        return weekdoneItemCommentsDropdown(auth as OAuth2PropertyValue, Number(item_id));
      },
    }),
  },
  async run({ auth, propsValue }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.DELETE,
      path: `/item/${propsValue.item_id}/comments/${propsValue.comment_id}`,
    });
  },
});
