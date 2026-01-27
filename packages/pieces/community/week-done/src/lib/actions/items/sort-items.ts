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
} from '../../common';

export const sortItemsAction = createAction({
  auth: weekdoneAuth,
  name: 'sort_items',
  displayName: 'Sort Items',
  description: 'Sort items within a type and period.',
  props: {
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
      required: true,
    }),
    item_id: Property.Dropdown({
      auth: weekdoneAuth,
      displayName: 'Any Item From This List',
      description: 'Weekdone requires an item ID in the URL to sort the list.',
      required: true,
      refreshers: ['team_id', 'type_id', 'period'],
      options: async ({ auth, team_id, type_id, period }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        if (!type_id || !period) {
          return {
            disabled: true,
            placeholder: 'Select type and period first',
            options: [],
          };
        }
        return weekdoneItemsDropdown(auth as OAuth2PropertyValue, {
          teamId: team_id ? Number(team_id) : undefined,
          period: period as string,
          typeId: Number(type_id),
        });
      },
    }),
    list: Property.Array({
      displayName: 'Item IDs (in order)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const itemIds = (propsValue.list ?? []).map((v) => String(v)).join(',');

    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.POST,
      path: `/item/${propsValue.item_id}/sort`,
      body: {
        type_id: propsValue.type_id,
        period: propsValue.period,
        list: itemIds,
      },
    });
  },
});
