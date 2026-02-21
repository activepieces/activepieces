import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { Client } from '@hubspot/api-client';
import { standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const hubspotGetCompanyAction = createAction({
	auth: hubspotAuth,
	name: 'get_company_mcp',
	displayName: 'Get Company',
	description: 'Get an existing company from HubSpot',
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			description: 'The ID of the company to retrieve',
			required: true,
		}),
		properties: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'Properties',
			required: false,
			description: 'The properties to retrieve'
		}, true, false),
	},
	async run(context) {
		const client = new Client({ accessToken: context.auth.access_token });
		const properties = context.propsValue.properties as string[] | undefined;

		return await client.crm.companies.basicApi.getById(
			context.propsValue.companyId,
			properties
		);
	},
});
