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
		const phoneNumbers = await fetchAllPhoneNumbers({
			accessToken: context.auth.props.access_token,
			businessAccountId: context.auth.props.businessAccountId,
		});
		return {
			phone_numbers: phoneNumbers,
			count: phoneNumbers.length,
		};
	},
});

async function fetchAllPhoneNumbers({ accessToken, businessAccountId }: FetchAllParams): Promise<PhoneNumberRecord[]> {
	const pages: PhoneNumberRecord[][] = [];
	let after: string | undefined = undefined;
	for (let page = 0; page < MAX_PAGES; page++) {
		const response: PhoneNumbersPage = await whatsappClient.request<PhoneNumbersPage>({
			accessToken,
			method: HttpMethod.GET,
			path: `/${businessAccountId}/phone_numbers`,
			queryParams: {
				fields: 'id,verified_name,display_phone_number,quality_rating,code_verification_status,platform_type',
				limit: String(PAGE_SIZE),
				...(after ? { after } : {}),
			},
		});
		pages.push(response.data);
		after = response.paging?.next ? response.paging.cursors?.after : undefined;
		if (!after) break;
	}
	return pages.flat();
}

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

type FetchAllParams = { accessToken: string; businessAccountId: string };
type PhoneNumbersPage = {
	data: PhoneNumberRecord[];
	paging?: { cursors?: { before?: string; after?: string }; next?: string };
};

type PhoneNumberRecord = {
	id: string;
	verified_name: string;
	display_phone_number: string;
	quality_rating: string;
	code_verification_status?: string;
	platform_type?: string;
};
