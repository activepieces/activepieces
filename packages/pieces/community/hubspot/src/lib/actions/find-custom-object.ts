import { MarkdownVariant } from '@activepieces/shared';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { hubspotAuth } from '../../';
import {  customObjectDropdown, customObjectPropertiesDropdown } from '../common/props';
import { FilterOperatorEnum } from '../common/types';

export const findCustomObjectAction = createAction({
	auth: hubspotAuth,
	name: 'find-custom-object',
	displayName: 'Find Custom Object',
	description: 'Finds a custom object by searching.',
	props: {
		customObjectType: customObjectDropdown,
		firstSearchPropertyName: customObjectPropertiesDropdown('First search property name', true,true),
		firstSearchPropertyValue: Property.ShortText({
			displayName: 'First search property value',
			required: true,
		}),
		secondSearchPropertyName: customObjectPropertiesDropdown('Second search property name', false,true),
		secondSearchPropertyValue: Property.ShortText({
			displayName: 'Second search property value',
			required: false,
		}),
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
		const {
			firstSearchPropertyValue,
			secondSearchPropertyValue,
		} = context.propsValue;
        const firstSearchPropertyName = context.propsValue.firstSearchPropertyName?.['values'] as string;
        const secondSearchPropertyName = context.propsValue.secondSearchPropertyName?.['values'] as string;

		let additionalPropertiesToRetrieve =context.propsValue.additionalPropertiesToRetrieve?.['values'];

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

		const filters = [
			{
				propertyName: firstSearchPropertyName as unknown as string,
				operator: FilterOperatorEnum.Eq,
				value: firstSearchPropertyValue,
			},
		];

		if (secondSearchPropertyName && secondSearchPropertyValue) {
			filters.push({
				propertyName: secondSearchPropertyName as unknown as string,
				operator: FilterOperatorEnum.Eq,
				value: secondSearchPropertyValue,
			});
		}

        console.log(JSON.stringify(filters));
        console.log(JSON.stringify(additionalPropertiesToRetrieve));

		const client = new Client({ accessToken: context.auth.access_token });

		const response = await client.crm.objects.searchApi.doSearch(customObjectType, {
			limit: 100,
			properties: additionalPropertiesToRetrieve,
			filterGroups: [{ filters }],
		});

		return response;
	},
});
