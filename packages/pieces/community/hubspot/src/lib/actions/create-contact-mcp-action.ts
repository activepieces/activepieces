import { createAction, Property, StaticPropsValue } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { Client } from '@hubspot/api-client';
import { standardObjectDynamicProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

/**
 * Action to create a new HubSpot contact with optional additional properties.
 */
export const hubspotCreateContactAction = createAction({
	auth: hubspotAuth,
	name: 'create_contact_mcp',
	displayName: 'Create Contact',
	description: 'Creates a new contact record in HubSpot.',
	props: {
		/**
		 * Primary email address for the new contact.
		 */
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Primary email address for the contact.',
			required: true,
		}),
		/**
		 * Contact's first name.
		 */
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: "The contact's first name.",
			required: false,
		}),
		/**
		 * Contact's last name.
		 */
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: "The contact's last name.",
			required: false,
		}),
		/**
		 * Dynamic additional properties based on the HubSpot schema.
		 */
		additionalProperties: standardObjectDynamicProperties(OBJECT_TYPE.CONTACT, ['email', 'firstname', 'lastname']),
	},
	async run(context) {
		const client = new Client({ accessToken: context.auth.access_token });
		const properties: Record<string, string> = {
			email: context.propsValue.email,
		};
		
		if (context.propsValue.firstName) {
			properties.firstname = context.propsValue.firstName;
		}
		if (context.propsValue.lastName) {
			properties.lastname = context.propsValue.lastName;
		}

		const additionalProps = context.propsValue.additionalProperties;
		if (additionalProps && typeof additionalProps === 'object') {
			Object.entries(additionalProps).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					properties[key] = String(value);
				}
			});
		}

		return await client.crm.contacts.basicApi.create({
			properties,
		});
	},
});
