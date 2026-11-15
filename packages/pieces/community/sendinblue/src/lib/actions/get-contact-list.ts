import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getContactListActionOutputSchema } from '../output-schemas';

export const getContactList = createAction({
	auth: sendinblueAuth,
	name: 'get_contact_list',
	outputSchema: getContactListActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Contact List',
	description: 'Get the details of a single Brevo contact list by id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches a single Brevo contact list by its numeric id, including subscriber counts and folder id. Pass start_date and end_date together to also include the list campaign statistics for that window. Returns found:false instead of failing when the list id does not exist, so it is safe to branch on. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		list_id: Property.Number({
			displayName: 'List ID',
			required: true,
		}),
		start_date: Property.ShortText({
			displayName: 'Start Date',
			description:
				'ISO 8601 date (e.g. 2023-01-01). Must be given together with End Date for campaign statistics to appear in the response.',
			required: false,
		}),
		end_date: Property.ShortText({
			displayName: 'End Date',
			description:
				'ISO 8601 date (e.g. 2023-01-31). Must be given together with Start Date for campaign statistics to appear in the response.',
			required: false,
		}),
	},
	async run(context) {
		const { list_id, start_date, end_date } = context.propsValue;

		try {
			const list = await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/contacts/lists/${list_id}`,
				query: {
					startDate: start_date,
					endDate: end_date,
				},
			});

			return { found: true, data: list };
		} catch (error) {
			if (error instanceof HttpError && error.response.status === 404) {
				return { found: false, data: {} };
			}
			throw error;
		}
	},
});
