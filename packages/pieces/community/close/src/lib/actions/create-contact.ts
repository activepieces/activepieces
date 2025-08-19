import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { CloseCRMContact } from '../common/types';
import { customFields, leadId } from '../common/props';
import { closeApiCall } from '../common/client';

export const createContact = createAction({
	auth: closeAuth,
	name: 'create_contact',
	displayName: 'Create Contact',
	description: 'Creates a new contact.',
	props: {
		lead_id: leadId(),
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		officePhone: Property.ShortText({
			displayName: 'Office Phone',
			required: false,
		}),
		mobilePhone: Property.ShortText({
			displayName: 'Mobile Phone',
			required: false,
		}),
		homePhone: Property.ShortText({
			displayName: 'Home Phone',
			required: false,
		}),
		directPhone: Property.ShortText({
			displayName: 'Direct Phone',
			required: false,
		}),
		faxPhone: Property.ShortText({
			displayName: 'Fax Phone',
			required: false,
		}),
		otherPhone: Property.ShortText({
			displayName: 'Other Phone',
			required: false,
		}),
		officeEmail: Property.ShortText({
			displayName: 'Office Email',
			required: false,
		}),
		homeEmail: Property.ShortText({
			displayName: 'Home Email',
			required: false,
		}),
		directEmail: Property.ShortText({
			displayName: 'Direct Email',
			required: false,
		}),
		otherEmail: Property.ShortText({
			displayName: 'Other Email',
			required: false,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			required: false,
		}),
		customFields: customFields('contact'),
	},
	async run(context) {
		const {
			lead_id,
			name,
			title,
			officeEmail,
			officePhone,
			otherEmail,
			otherPhone,
			mobilePhone,
			homeEmail,
			url,
			homePhone,
			directEmail,
			directPhone,
			faxPhone,
		} = context.propsValue;

		const customFields = context.propsValue.customFields ?? {};

		const transformedCustomFields = Object.fromEntries(
			Object.entries(customFields)
				.filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0))
				.map(([key, value]) => [`custom.${key}`, value]),
		);

		const payload: Partial<CloseCRMContact> = {
			lead_id: lead_id,
			title: title,
			name: name,
			...transformedCustomFields,
			phones: [],
			emails: [],
			urls: [],
		};

		// Add emails if present
		if (officeEmail) payload.emails?.push({ email: officeEmail.trim(), type: 'office' });
		if (otherEmail) payload.emails?.push({ email: otherEmail.trim(), type: 'other' });
		if (homeEmail) payload.emails?.push({ email: homeEmail.trim(), type: 'home' });
		if (directEmail) payload.emails?.push({ email: directEmail.trim(), type: 'direct' });

		// Add phones if present
		if (officePhone) payload.phones?.push({ phone: officePhone.trim(), type: 'office' });
		if (otherPhone) payload.phones?.push({ phone: otherPhone.trim(), type: 'other' });
		if (mobilePhone) payload.phones?.push({ phone: mobilePhone.trim(), type: 'mobile' });
		if (homePhone) payload.phones?.push({ phone: homePhone.trim(), type: 'home' });
		if (directPhone) payload.phones?.push({ phone: directPhone.trim(), type: 'direct' });
		if (faxPhone) payload.phones?.push({ phone: faxPhone.trim(), type: 'fax' });

		if (url) payload.urls?.push({ url, type: 'url' });

		try {
			const response = await closeApiCall({
				accessToken: context.auth,
				method: HttpMethod.POST,
				resourceUri: '/contact/',
				body: payload,
			});

			return response;
		} catch (error: any) {
			if (error.response?.status === 400) {
				throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
			}
			if (error.response?.status === 404) {
				throw new Error(`Lead not found with ID: ${lead_id}`);
			}
			throw new Error(`Error creating contact: ${error.message}`);
		}
	},
});
