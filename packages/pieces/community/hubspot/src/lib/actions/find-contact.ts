import { MarkdownVariant } from '@activepieces/pieces-framework';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { FilterOperatorEnum } from '../common/types';
import { contactSearchOutputSchema } from '../output-schemas';

export const findContactAction = createAction({
	auth: hubspotAuth,
	name: 'find-contact',
	classification: 'SEARCH',
	displayName: 'Find Contact',
	description: 'Finds up to 200 contacts matching one or two property values.',
	audience: 'both',
	aiMetadata: { description: 'Search HubSpot contacts by one or two property/value pairs (matched with equality) and return the matching contacts. Read-only and repeatable. Use this to resolve a contact before updating or enrolling it; pick a create action instead when no match should exist.', idempotent: true },
	outputSchema: contactSearchOutputSchema,
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.CONTACT,
				displayName: 'Search Property',
				description: 'The property to compare, such as the email address.',
				required: true,
			},
			true,
			true,
		),
		firstSearchPropertyValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'Only exact matches are returned.',
			required: true,
		}),
		secondSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.CONTACT,
				displayName: 'Second Search Property',
				description: 'Optional second condition; records must match both.',
				required: false,
				advanced: true,
			},
			true,
			true,
		),
		secondSearchPropertyValue: Property.ShortText({
			displayName: 'Second Search Value',
			description: 'Ignored unless a second property is also chosen.',
			required: false,
			advanced: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: firstname, lastname, email, company, website, mobilephone, phone, fax, address, city, state, zip, salutation, country, jobtitle, hs_createdate, hs_email_domain, hs_object_id, lastmodifieddate, hs_persona, hs_language, lifecyclestage, createdate, numemployees, annualrevenue, industry.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.CONTACT,
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const {
			firstSearchPropertyName,
			firstSearchPropertyValue,
			secondSearchPropertyName,
			secondSearchPropertyValue,
		} = context.propsValue;

		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const filters = [
			{
				propertyName: firstSearchPropertyName as string,
				operator: FilterOperatorEnum.Eq,
				value: firstSearchPropertyValue,
			},
		];

		if (secondSearchPropertyName && secondSearchPropertyValue) {
			filters.push({
				propertyName: secondSearchPropertyName as string,
				operator: FilterOperatorEnum.Eq,
				value: secondSearchPropertyValue,
			});
		}

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const defaultContactProperties = getDefaultPropertiesForObject(OBJECT_TYPE.CONTACT);

		const response = client.crm.contacts.searchApi.doSearch({
			limit: MAX_SEARCH_PAGE_SIZE,
			properties: [...defaultContactProperties, ...additionalPropertiesToRetrieve],
			filterGroups: [{ filters }],
		});

		return response;
	},
});
