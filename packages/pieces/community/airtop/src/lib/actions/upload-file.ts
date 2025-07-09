import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall, extractApiData, AirtopSession } from '../common/client';
import { fileId } from '../common/props';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const uploadFileToSessionAction = createAction({
	auth: airtopAuth,
	name: 'upload-file-to-session',
	displayName: 'Upload File to Sessions',
	description: 'Push an existing file to one or more sessions, making it available for use in file inputs or downloads.',
	props: {
		fileId: fileId,
		sessionIds: Property.MultiSelectDropdown({
			displayName: 'Session IDs',
			description: 'Select one or more sessions to make the file available on. Leave empty to make available to all sessions.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Connect your account first',
					};
				}

				try {
					const response = await airtopApiCall<any>({
						apiKey: auth as string,
						method: HttpMethod.GET,
						resourceUri: '/sessions',
					});

					const sessions = extractApiData<AirtopSession>(response);
					
					if (sessions.length === 0) {
						return {
							disabled: false,
							options: [],
							placeholder: 'No active sessions found. Create a session first.',
						};
					}

					const sortedSessions = sessions.sort((a, b) => {
						if (a.status === 'active' && b.status !== 'active') return -1;
						if (a.status !== 'active' && b.status === 'active') return 1;
						return 0;
					});

					const options = sortedSessions.map((session) => ({
						label: `${session.id} (${session.status})`,
						value: session.id,
					}));

					return {
						disabled: false,
						options,
						placeholder: options.length === 0 ? 'No sessions available' : 'Select sessions or leave empty for all',
					};
				} catch (error: any) {
					return {
						disabled: true,
						options: [],
						placeholder: `Error loading sessions: ${error.message}`,
					};
				}
			},
		}),
	},
	async run({ propsValue, auth }) {
		const { fileId, sessionIds } = propsValue;

		if (sessionIds && sessionIds.length > 0) {
			await propsValidation.validateZod({ sessionIds }, {
				sessionIds: z.array(z.string().min(1, 'Session ID cannot be empty')).min(1, 'At least one session ID is required when providing session IDs'),
			});
		}

		const body: Record<string, any> = {};
		
		if (sessionIds && sessionIds.length > 0) {
			body['sessionIds'] = sessionIds;
		}

		const result = await airtopApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: `/files/${fileId}/push`,
			body,
		});

		return {
			fileId,
			sessionIds: sessionIds && sessionIds.length > 0 ? sessionIds : 'all sessions',
			sessionsCount: sessionIds?.length || 'all',
			message: sessionIds && sessionIds.length > 0 
				? `File successfully pushed to ${sessionIds.length} session(s).`
				: 'File successfully pushed to all sessions.',
			result,
		};
	},
});
