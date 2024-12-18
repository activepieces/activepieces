import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { additionalPropertyNamesDropdown, getDefaultProperties } from '../common/props';

export const getContactAction = createAction({
	auth: hubspotAuth,
	name: 'get-contact',
	displayName: 'Get Contact',
	description: 'Gets a contact.',
	props: {
		contactId : Property.ShortText({
			displayName: 'Contact ID',
			description: 'The ID of the contact to get.',
			required: true,
		}),
		additionalProperties:additionalPropertyNamesDropdown(OBJECT_TYPE.CONTACT)

	},
	async run(context) {
		const contactId = context.propsValue.contactId;
		const additionalProperties = context.propsValue.additionalProperties ?? [];

		const defaultProperties = getDefaultProperties(OBJECT_TYPE.CONTACT)

		// https://developers.hubspot.com/docs/reference/api/crm/objects/contacts#get-%2Fcrm%2Fv3%2Fobjects%2Fcontacts%2F%7Bcontactid%7D
		const contactResponse = await hubspotApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri:`/crm/v3/objects/contacts/${contactId}`,
			query:{
				properties: [...defaultProperties, ...additionalProperties].join(',')
			}
		})

		return contactResponse;
	},
});
