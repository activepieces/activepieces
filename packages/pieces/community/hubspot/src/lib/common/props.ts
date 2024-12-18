import {
	DropdownOption,
	OAuth2PropertyValue,
	PieceAuth,
	Property,
} from '@activepieces/pieces-framework';
import { hubSpotClient } from './client';
import { hubspotApiCall } from '.';
import { HttpMethod } from '@activepieces/pieces-common';
import { HubspotProperty } from './types';

export const hubSpotAuthentication = PieceAuth.OAuth2({
	authUrl: 'https://app.hubspot.com/oauth/authorize',
	tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
	required: true,
	scope: [
		'crm.lists.read',
		'crm.lists.write',
		'crm.objects.contacts.read',
		'crm.objects.contacts.write',
		'crm.objects.companies.read',
		'crm.objects.deals.read',
		'tickets',
		'forms',
	],
});

const buildEmptyList = ({ placeholder }: { placeholder: string }) => {
	return {
		disabled: true,
		options: [],
		placeholder,
	};
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

		const options = listsResponse.lists.map((list) => ({
			label: list.name,
			value: list.listId,
		}));

		return {
			disabled: false,
			options,
		};
	},
});

export function getDefaultProperties(objectType:string) {
	if (objectType === "contact") {
	  return DEFAULT_CONTACT_PROPERTIES;
	} else {
	  return [];
	}
}

export const additionalPropertyNamesDropdown = (objectType: string) =>
	Property.MultiSelectDropdown({
		displayName: 'Additional Properties',
		refreshers: [],
		required: false,
		options: async ({ auth }) => {
			if (!auth) {
				return buildEmptyList({
					placeholder: 'Please connect your account.',
				});
			}
			const token = (auth as OAuth2PropertyValue).access_token;
			const propertiesResponse = await hubspotApiCall<{ results: HubspotProperty[] }>({
				accessToken: token,
				method: HttpMethod.GET,
				resourceUri: `/crm/v3/properties/${objectType}`,
			});

			const defaultProperties = getDefaultProperties(objectType);

			const options: DropdownOption<string>[] = [];
			for (const property of propertiesResponse.results) {
				if(defaultProperties.includes(property.name)) {
					continue;
				}
				options.push({
					label: property.label,
					value: property.name,
				});
			}

			return {
				disabled: false,
				options,
			};
		},
	});
