import { createAction, Property } from '@activepieces/pieces-framework';

import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../common/auth';
import { websiteIdProp } from '../common/props';
import { crispApiCall } from '../common/client';
import { HttpStatusCode } from 'axios';

export const createOrUpdateContactAction = createAction({
	auth: crispAuth,
	name: 'create_update_contact',
	displayName: 'Create/Update Contact',
	description: 'Creates a new contact or updates an existing contact.',
	audience: 'both',
	aiMetadata: { description: 'Upserts a person profile in a Crisp website by email: updates the existing contact if one matches, otherwise creates it. Use to keep contact details (name, phone, address, company, website, notepad) in sync. Idempotent: keyed on the stable email, so repeating with the same input yields the same contact.', idempotent: true },
	props: {
		websiteId: websiteIdProp,
		email: Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
		}),
		address: Property.LongText({
			displayName: 'Address',
			required: false,
		}),
		company: Property.ShortText({
			displayName: 'Company',
			required: false,
		}),
		website: Property.ShortText({
			displayName: 'Contact Website',
			required: false,
		}),
		notepad: Property.LongText({
			displayName: 'Notepad',
			required: false,
		}),
	},
	async run(context) {
		const { websiteId, website, email, name, phone, address, company, notepad } =
			context.propsValue;

		const contactPayload: Record<string, any> = {
			email,
			person: {
				nickname: name,
			},
			notepad,
		};

		if (phone) contactPayload['person']['phone'] = phone;
		if (address) contactPayload['person']['address'] = address;
		if (website) contactPayload['person']['website'] = website;
		if (company) contactPayload['company'] = { name: company };

		try {
			await crispApiCall({
				auth: context.auth,
				method: HttpMethod.PUT,
				resourceUri: `/website/${websiteId}/people/profile/${email}`,
				body: contactPayload,
			});
		} catch (e) {
			const err = e as HttpError;
			if (err.response.status === HttpStatusCode.NotFound) {
				await crispApiCall({
					auth: context.auth,
					method: HttpMethod.POST,
					resourceUri: `/website/${websiteId}/people/profile`,
					body: contactPayload,
				});
			}
		}

		const response = await crispApiCall({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/website/${websiteId}/people/profile/${email}`,
		});

		return response;
	},
});
