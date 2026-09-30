import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappClient } from '../common/client';
import { getPhoneNumberOutputSchema } from '../output-schemas';

export const getPhoneNumber = createAction({
	auth: whatsappAuth,
	name: 'get_phone_number',
	outputSchema: getPhoneNumberOutputSchema,
	classification: 'READ',
	displayName: 'Get Phone Number',
	description: 'Returns the details and health of one business phone number.',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns one WhatsApp business phone number with its verified name, quality rating, messaging throughput level, verification status and name status. Use it to check the sender health before a campaign; use List Phone Numbers to enumerate them. Idempotent — a pure read.',
		idempotent: true,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
	},
	async run(context) {
		return whatsappClient.request({
			accessToken: context.auth.props.access_token,
			method: HttpMethod.GET,
			path: `/${context.propsValue.phone_number_id}`,
			queryParams: {
				fields:
					'id,verified_name,display_phone_number,quality_rating,code_verification_status,name_status,status,throughput,platform_type',
			},
		});
	},
});
