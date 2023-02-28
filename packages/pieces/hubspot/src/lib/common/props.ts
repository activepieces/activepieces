import { OAuth2PropertyValue, Property } from '@activepieces/framework';
import { hubSpotClient } from './client';

export const hubSpotAuthentication = Property.OAuth2({
  displayName: 'Authentication',
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
  required: true,
  scope: [
    'crm.lists.read',
    'crm.lists.write',
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
  ],
});

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
  return {
    disabled: true,
    options: [],
    placeholder,
  }
};

export const hubSpotListIdDropdown = Property.Dropdown<number>({
  displayName: 'List',
  refreshers: ['authentication'],
  description: 'List to add contact to',
  required: true,
  options: async (propsValue) => {
    if (propsValue['authentication'] === undefined) {
      return buildEmptyList({
        placeholder: 'Please select an authentication',
      });
    }

    const token = (propsValue['authentication'] as OAuth2PropertyValue).access_token;
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
