import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../../';
import { customObjectDropdown, customObjectPropertiesDropdown } from '../common/props';

export const getCustomObjectAction = createAction({
	auth: hubspotAuth,
	name: 'get-custom-object',
	displayName: 'Get Custom Object',
	description: 'Gets a custom object.',
	props: {
		customObjectType: customObjectDropdown,
		customObjectId: Property.ShortText({
			displayName: 'Custom Object ID',
			description: 'The ID of the custom object to get.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                  
                    hs_object_id, hs_lastmodifieddate, hs_createdate   
      
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: customObjectPropertiesDropdown('Additional Properties to Retrieve', false),
	},
	async run(context) {
		const customObjectType = context.propsValue.customObjectType as string;
		const customObjectId = context.propsValue.customObjectId as string;
		const additionalPropertiesToRetrieve =
			context.propsValue.additionalPropertiesToRetrieve?.['values'];

		let propertiesToRetrieve;
		try {
			if (Array.isArray(additionalPropertiesToRetrieve)) {
				propertiesToRetrieve = additionalPropertiesToRetrieve;
			}
			if (typeof additionalPropertiesToRetrieve === 'string') {
				propertiesToRetrieve = JSON.parse(additionalPropertiesToRetrieve as string);
			}
		} catch (error) {
			propertiesToRetrieve = [];
		}

		const client = new Client({ accessToken: context.auth.access_token });

		const customObjectDetails = await client.crm.objects.basicApi.getById(
			customObjectType,
			customObjectId,
			propertiesToRetrieve,
		);

		return customObjectDetails;
	},
});
