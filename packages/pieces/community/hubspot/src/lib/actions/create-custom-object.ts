import { hubspotAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import {
	customObjectDropdown,
	customObjectDynamicProperties,
	customObjectPropertiesDropdown,
} from '../common/props';

import { Client } from '@hubspot/api-client';

export const createCustomObjectAction = createAction({
	auth: hubspotAuth,
	name: 'create-custome-object',
	displayName: 'Create Custom Object',
	description: 'Creates a custom object in Hubspot.',
	props: {
		customObjectType: customObjectDropdown,
		objectProperties: customObjectDynamicProperties,
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                            
                    hs_object_id, hs_lastmodifieddate, hs_createdate   

                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: customObjectPropertiesDropdown(
			'Additional Properties to Retrieve',
			false,
		),
	},
	async run(context) {
		const customObjectType = context.propsValue.customObjectType as string;
		const objectProperties = context.propsValue.objectProperties ?? {};
		let additionalPropertiesToRetrieve =
			context.propsValue.additionalPropertiesToRetrieve?.['values'];

		try {
			if (Array.isArray(additionalPropertiesToRetrieve)) {
				additionalPropertiesToRetrieve = additionalPropertiesToRetrieve;
			}
			if (typeof additionalPropertiesToRetrieve === 'string') {
				additionalPropertiesToRetrieve = JSON.parse(additionalPropertiesToRetrieve as string);
			}
		} catch (error) {
			additionalPropertiesToRetrieve = [];
		}

		const customObjectProperties: Record<string, string> = {};

		// Add additional properties to the customObjectProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			customObjectProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const createdCustomObject = await client.crm.objects.basicApi.create(customObjectType, {
			properties: customObjectProperties,
			associations: [],
		});

		const customObjectDetails = await client.crm.objects.basicApi.getById(
			customObjectType,
			createdCustomObject.id,
			additionalPropertiesToRetrieve,
		);

		return customObjectDetails;
	},
});
