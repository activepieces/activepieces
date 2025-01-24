import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { standardObjectDynamicProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { FilterOperatorEnum } from '../common/types';


export const createOrUpdateContactAction = createAction({
	auth: hubspotAuth,
	name: 'create-or-update-contact',
	displayName: 'Create or Update Contact',
	description: 'Creates a new contact or updates an existing contact based on email address.',
	props: {
		email: Property.ShortText({
			displayName: 'Contact Email',
			required: true,
		}),
		objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.CONTACT, ['email']),
	},
	async run(context) {
		const email = context.propsValue.email;
		const objectProperties = context.propsValue.objectProperties ?? {};

		const contactProperties: Record<string, string> = {};

		// Add additional properties to the contactProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			contactProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const searchResponse = await client.crm.contacts.searchApi.doSearch({
			limit: 1,
			filterGroups: [
				{ filters: [{ propertyName: 'email', operator: FilterOperatorEnum.Eq, value: email }] },
			],
		});

		if (searchResponse.results.length > 0) {
			const updatedContact = await client.crm.contacts.basicApi.update(
				searchResponse.results[0].id,
				{
					properties: contactProperties,
				},
			);
			return updatedContact;
		} else {
			const createdContact = await client.crm.contacts.basicApi.create({
				properties: { ...contactProperties, email },
			});
			return createdContact;
		}
	},
});
