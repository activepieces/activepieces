import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappClient } from '../common/client';
import { getBusinessProfileOutputSchema } from '../output-schemas';

export const getBusinessProfile = createAction({
	auth: whatsappAuth,
	name: 'get_business_profile',
	outputSchema: getBusinessProfileOutputSchema,
	classification: 'READ',
	displayName: 'Get Business Profile',
	description: 'Returns the public business profile shown for a phone number.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns the WhatsApp business profile attached to a phone number: about text, address, description, email, websites, vertical and profile picture URL. Use it to read the current values before Update Business Profile. Idempotent — a pure read.',
		idempotent: true,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
	},
	async run(context) {
		const response = await whatsappClient.request<{ data: BusinessProfile[] }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.GET,
			path: `/${context.propsValue.phone_number_id}/whatsapp_business_profile`,
			queryParams: {
				fields: 'about,address,description,email,profile_picture_url,websites,vertical',
			},
		});
		return response.data[0];
	},
});

export type BusinessProfile = {
	messaging_product: string;
	about?: string;
	address?: string;
	description?: string;
	email?: string;
	profile_picture_url?: string;
	websites?: string[];
	vertical?: string;
};
