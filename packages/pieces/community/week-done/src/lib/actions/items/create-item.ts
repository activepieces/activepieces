import { HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { weekdoneAuth } from '../../../index';
import {
  weekdoneApiCall,
  weekdoneTeamsDropdown,
  weekdoneTypesDropdown,
  weekdoneUsersDropdown,
} from '../../common';

export const createItemAction = createAction({
  auth: weekdoneAuth,
  name: 'create_item',
  displayName: 'Create Item',
  description: 'Create a new item.',
  props: {
    description: Property.LongText({
      displayName: 'Description',
      required: true,
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
    type_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'Type',
      required: true,
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
    period: Property.ShortText({
      displayName: 'Period',
      required: false,
    }),
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
        return weekdoneUsersDropdown(auth as OAuth2PropertyValue);
      },
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
    source_id: Property.ShortText({
      displayName: 'Source ID',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      required: false,
    }),
    private: Property.StaticDropdown<number>({
      displayName: 'Visibility',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 0 },
          { label: 'Private', value: 1 },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.POST,
      path: '/item',
      body: {
        description: propsValue.description,
        type_id: propsValue.type_id,
        period: propsValue.period,
        user_id: propsValue.user_id,
        team_id: propsValue.team_id,
        priority: propsValue.priority,
        source_id: propsValue.source_id,
        due_on: propsValue.due_on,
        private: propsValue.private,
      },
    });
  },
});
