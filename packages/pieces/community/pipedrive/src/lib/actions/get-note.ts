import { pipedriveAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getNoteAction = createAction({
	auth: pipedriveAuth,
	name: 'get-note',
	displayName: 'Retrieve a Note',
	description: 'Finds a note by ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Retrieves a single note by its numeric note ID. Use when you already have the note ID; to list the notes attached to a deal, lead, person, or organization, use Find Notes instead. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		noteId: Property.Number({
			displayName: 'Note ID',
			required: true,
		}),
	},
	async run(context) {
		try {
			const response = await pipedriveApiCall({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: `/v1/notes/${context.propsValue.noteId}`,
			});
			return response;
		} catch (error) {
			return {
				success: false,
                data:{}
			};
		}
	},
});
