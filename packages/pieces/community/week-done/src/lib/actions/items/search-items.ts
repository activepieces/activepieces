import { HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { weekdoneAuth } from '../../../index';
import { weekdoneApiCall, weekdoneTeamsDropdown, weekdoneUsersDropdown } from '../../common';

export const searchItemsAction = createAction({
  auth: weekdoneAuth,
  name: 'search_items',
  displayName: 'Search Items',
  description: 'Search for items.',
  props: {
    user_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'User',
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
      displayName: 'Team',
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
      displayName: 'Period',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      path: '/items',
      query: {
        user_id: propsValue.user_id as any,
        team_id: propsValue.team_id as any,
        period: propsValue.period,
      },
    });
  },
});
