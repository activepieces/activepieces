import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { inputUtils } from '../common/inputs';
import { updateBusinessProfileOutputSchema } from '../output-schemas';

export const updateBusinessProfile = createAction({
	auth: whatsappAuth,
	name: 'update_business_profile',
	outputSchema: updateBusinessProfileOutputSchema,
	classification: 'WRITE',
	displayName: 'Update Business Profile',
	description: 'Updates the public business profile for a phone number. Empty fields are left unchanged.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates the WhatsApp business profile of a phone number: about, address, description, email, websites and vertical. Only the fields you fill are sent, so existing values you leave empty are kept. Use Get Business Profile first to see the current values. Idempotent — resending the same values leaves the profile unchanged.',
		idempotent: true,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		about: Property.ShortText({
			displayName: 'About',
			description: 'Short status line, max 139 characters.',
			required: false,
		}),
		address: Property.ShortText({ displayName: 'Address', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		websites: Property.Array({
			displayName: 'Websites',
			description: 'Up to two URLs.',
			required: false,
		}),
		vertical: whatsappProps.businessVertical,
	},
	async run(context) {
		const { phone_number_id, about, address, description, email, websites, vertical } = context.propsValue;
		const websiteEntries = inputUtils.asStrings(websites);
		const response = await whatsappClient.request<{ success: boolean }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.POST,
			path: `/${phone_number_id}/whatsapp_business_profile`,
			body: {
				messaging_product: 'whatsapp',
				...(about ? { about } : {}),
				...(address ? { address } : {}),
				...(description ? { description } : {}),
				...(email ? { email } : {}),
				...(websiteEntries.length > 0 ? { websites: websiteEntries } : {}),
				...(vertical ? { vertical } : {}),
			},
		});
		return response;
	},
});
