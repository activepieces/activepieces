import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { Client } from '@hubspot/api-client';
import { standardObjectDynamicProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const hubspotCreateContactAction = createAction({
	auth: hubspotAuth,
	name: 'create_contact_mcp',
	displayName: 'Create Contact',
	description: 'Create a new contact in HubSpot',
	props: {
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The email of the contact',
			required: true,
		}),
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'The first name of the contact',
			required: false,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'The last name of the contact',
			required: false,
		}),
		additionalProperties: standardObjectDynamicProperties(OBJECT_TYPE.CONTACT, ['email', 'firstname', 'lastname']),
	},
	async run(context) {
		const client = new Client({ accessToken: context.auth.access_token });
		const properties: Record<string, string> = {
			email: context.propsValue.email,
		};
		if (context.propsValue.firstName) properties.firstname = context.propsValue.firstName;
		if (context.propsValue.lastName) properties.lastname = context.propsValue.lastName;

		const additionalProps = context.propsValue.additionalProperties;
		if (additionalProps) {
			Object.entries(additionalProps).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					properties[key] = value.toString();
				}
			});
		}

		return await client.crm.contacts.basicApi.create({
			properties,
		});
	},
});
