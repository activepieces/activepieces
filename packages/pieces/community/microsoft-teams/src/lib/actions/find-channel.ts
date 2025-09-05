import { microsoftTeamsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const findChannelAction = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_find_channel',
	displayName: 'Find Channel',
	description: 'Retrieve the properties and relationships of a channel.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
		includeEmail: Property.Checkbox({
			displayName: 'Include Email',
			description: 'Include the channel email address (may impact performance)',
			required: false,
			defaultValue: false,
		}),
		includeSummary: Property.Checkbox({
			displayName: 'Include Summary',
			description: 'Include the channel summary (may impact performance)',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { teamId, channelId, includeEmail, includeSummary } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		// Build select parameter for better performance
		let selectFields = ['id', 'createdDateTime', 'displayName', 'description', 'membershipType', 'isArchived'];
		
		if (includeEmail) {
			selectFields.push('email');
		}
		
		if (includeSummary) {
			selectFields.push('summary');
		}

		let apiCall = client.api(`/teams/${teamId}/channels/${channelId}`);
		
		// Add select parameter to improve performance
		apiCall = apiCall.select(selectFields.join(','));

		return await apiCall.get();
	},
});