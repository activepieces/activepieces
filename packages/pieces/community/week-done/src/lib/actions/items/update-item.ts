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
  weekdoneTypesDropdown,
  weekdoneUsersDropdown,
} from '../../common';

export const updateItemAction = createAction({
  auth: weekdoneAuth,
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Update an existing item.',
  props: {
    user_id: Property.Dropdown({
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
      refreshers: ['user_id', 'team_id', 'period'],
      options: async ({ auth, user_id, team_id, period }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        return weekdoneItemsDropdown(auth as OAuth2PropertyValue, {
          userId: user_id as any,
          teamId: team_id ? Number(team_id) : undefined,
          period: period as string | undefined,
        });
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    type_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'Type',
      required: false,
      refreshers: ['team_id'],
      options: async ({ auth, team_id }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        return weekdoneTypesDropdown(
          auth as OAuth2PropertyValue,
          team_id ? Number(team_id) : undefined
        );
      },
    }),
    update_period: Property.ShortText({
      displayName: 'Period (Required when updating Type)',
      required: false,
    }),
    priority: Property.StaticDropdown<number>({
      displayName: 'Priority',
      required: false,
      options: {
        options: [
          { label: 'Not specified', value: 0 },
          { label: 'Green', value: 1 },
          { label: 'Amber', value: 2 },
          { label: 'Red', value: 3 },
        ],
      },
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.PATCH,
      path: `/item/${propsValue.item_id}`,
      body: {
        description: propsValue.description,
        type_id: propsValue.type_id,
        period: propsValue.update_period,
        priority: propsValue.priority,
        due_on: propsValue.due_on,
      },
    });
  },
});
