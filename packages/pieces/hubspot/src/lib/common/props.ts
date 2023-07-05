import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { hubSpotClient } from './client';

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
  return {
    disabled: true,
    options: [],
    placeholder,
  }
};

export const hubSpotListIdDropdown = Property.Dropdown<number>({
  displayName: 'List',
  refreshers: [],
  description: 'List to add contact to',
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return buildEmptyList({
        placeholder: 'Please select an authentication',
      });
    }

    const token = (auth as OAuth2PropertyValue).access_token;
    const listsResponse = await hubSpotClient.lists.getStaticLists({ token });

    if (listsResponse.lists.length === 0) {
      return buildEmptyList({
        placeholder: 'No lists found! Please create a list.',
      });
    }

    const options = listsResponse.lists.map(list => ({
      label: list.name,
      value: list.listId,
    }));

    return {
      disabled: false,
      options,
    };
  }
});
