import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	getDefaultPropertiesForObject,
	standardObjectPropertiesDropdown,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';

export const getCompanyAction = createAction({
	auth: hubspotAuth,
	name: 'get-company',
	displayName: 'Get Company',
	description: 'Gets a company.',
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			description: 'The ID of the company to get.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
					
					name, domain, industry, about_us, phone, address, address2, city, state, zip, country, website, type, description, founded_year, hs_createdate, hs_lastmodifieddate, hs_object_id, is_public, timezone, total_money_raised, total_revenue, owneremail, ownername, numberofemployees, annualrevenue, lifecyclestage, createdate, web_technologies
					
					**Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	async run(context) {
		const { companyId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultCompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);

		const client = new Client({ accessToken: context.auth.access_token });

		const companyDetails = await client.crm.companies.basicApi.getById(companyId, [
			...defaultCompanyProperties,
			...additionalPropertiesToRetrieve,
		]);

		return companyDetails;
	},
});
