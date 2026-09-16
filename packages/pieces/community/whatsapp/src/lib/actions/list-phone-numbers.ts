import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { whatsappClient } from '../common/client';
import { listPhoneNumbersOutputSchema } from '../output-schemas';

export const listPhoneNumbers = createAction({
	auth: whatsappAuth,
	name: 'list_phone_numbers',
	outputSchema: listPhoneNumbersOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Phone Numbers',
	description: 'Lists the phone numbers registered on the business account.',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists every phone number on the WhatsApp Business Account with its id, verified display name, formatted number and quality rating. Use it to resolve the phone number id that every send action requires. Idempotent — a pure read.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const response = await whatsappClient.request<{ data: PhoneNumberRecord[] }>({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.GET,
			path: `/${context.auth.props.businessAccountId}/phone_numbers`,
			queryParams: {
				fields: 'id,verified_name,display_phone_number,quality_rating,code_verification_status,platform_type',
			},
		});
		return {
			phone_numbers: response.data,
			count: response.data.length,
		};
	},
});

type PhoneNumberRecord = {
	id: string;
	verified_name: string;
	display_phone_number: string;
	quality_rating: string;
	code_verification_status?: string;
	platform_type?: string;
};
