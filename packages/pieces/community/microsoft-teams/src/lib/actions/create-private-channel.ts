import { microsoftTeamsAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsCommon } from '../common';

export const createPrivateChannel = createAction({
	auth: microsoftTeamsAuth,
	name: 'microsoft_teams_create_private_channel',
	displayName: 'Create Private Channel',
	description: 'Creates a new private channel in a Microsoft Teams team.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		displayName: Property.ShortText({
			displayName: 'Channel Name',
			description: 'The name of the private channel (max 50 characters)',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'Optional description for the private channel',
			required: false,
		}),
		membershipType: Property.StaticDropdown({
			displayName: 'Membership Type',
			description: 'The type of membership for the private channel',
			required: true,
			defaultValue: 'private',
			options: {
				disabled: false,
				options: [
					{
						label: 'Private',
						value: 'private',
					},
					{
						label: 'Shared',
						value: 'shared',
					},
				],
			},
		}),
	},
	async run(context) {
		const { teamId, displayName, description, membershipType } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const channelData = {
			displayName: displayName,
			description: description || '',
			membershipType: membershipType,
		};

		// https://learn.microsoft.com/en-us/graph/api/channel-post?view=graph-rest-1.0&tabs=http
		return await client.api(`/teams/${teamId}/channels`).post(channelData);
	},
});
