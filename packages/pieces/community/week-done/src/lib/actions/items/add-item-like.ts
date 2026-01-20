import { HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { weekdoneAuth } from '../../../index';
import {
  weekdoneApiCall,
  weekdoneItemsDropdown,
  weekdoneTeamsDropdown,
  weekdoneUsersDropdown,
} from '../../common';

export const addItemLikeAction = createAction({
  auth: weekdoneAuth,
  name: 'add_item_like',
  displayName: 'Add Item Like',
  description: 'Add a like to an item.',
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
  },
  async run({ auth, propsValue }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.POST,
      path: `/item/${propsValue.item_id}/likes`,
    });
  },
});
