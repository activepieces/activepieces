import { createAction, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../..';
import {
	customObjectDropdown,
	customObjectDynamicProperties,
	customObjectPropertiesDropdown,
} from '../common/props';

import { Client } from '@hubspot/api-client';

export const updateCustomObjectAction = createAction({
	auth: hubspotAuth,
	name: 'update-custome-object',
	displayName: 'Update Custom Object',
	description: 'Updates a custom object in Hubspot.',
	props: {
		customObjectType: customObjectDropdown,
		customObjectId: Property.ShortText({
			displayName: 'Custom Object ID',
			description: 'The ID of the custom object to update.',
			required: true,
		}),
		objectProperties: customObjectDynamicProperties,
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
		const objectProperties = context.propsValue.objectProperties ?? {};
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

		const customObjectProperties: Record<string, string> = {};

		// Add additional properties to the customObjectProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			customObjectProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const updatedCustomObject = await client.crm.objects.basicApi.update(
			customObjectType,
			customObjectId,
			{
				properties: customObjectProperties,
			},
		);

		const customObjectDetails = await client.crm.objects.basicApi.getById(
			customObjectType,
			updatedCustomObject.id,
			propertiesToRetrieve,
		);

		return customObjectDetails;
	},
});
