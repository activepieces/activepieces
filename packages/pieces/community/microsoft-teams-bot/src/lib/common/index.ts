import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { Channel, Team } from '@microsoft/microsoft-graph-types';
import { microsoftTeamsBotAuth } from '../auth';
import { createGraphClient, getAppOnlyToken, GRAPH_DEFAULT_SCOPE, paginateGraphList } from './graph';

const graphClientFromAuth = async (
	auth: AppConnectionValueForAuthProperty<typeof microsoftTeamsBotAuth>,
) => {
	const token = await getAppOnlyToken({
		tenantId: auth.props.tenantId,
		appId: auth.props.appId,
		appSecret: auth.props.appSecret,
		scope: GRAPH_DEFAULT_SCOPE,
	});
	return createGraphClient(token);
};

export const microsoftTeamsBotCommon = {
	teamId: Property.Dropdown({
		auth: microsoftTeamsBotAuth,
		displayName: 'Team ID',
		refreshers: [],
		required: true,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}
			const client = await graphClientFromAuth(auth);

			// App-only listing of all teams in the tenant (needs Team.ReadBasic.All).
			// https://learn.microsoft.com/en-us/graph/api/teams-list?view=graph-rest-1.0
			const { items, error } = await paginateGraphList<Team>({
				client,
				initialUrl: '/teams',
				pageSize: 100,
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load teams — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((team) => ({ label: team.displayName!, value: team.id! })),
			};
		},
	}),
	channelId: Property.Dropdown({
		auth: microsoftTeamsBotAuth,
		displayName: 'Channel ID',
		refreshers: ['teamId'],
		required: true,
		options: async ({ auth, teamId }) => {
			if (!auth || !teamId) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first and select team.',
					options: [],
				};
			}
			const client = await graphClientFromAuth(auth);

			// List Channels : https://learn.microsoft.com/en-us/graph/api/channel-list?view=graph-rest-1.0&tabs=http
			// Note: this endpoint does not support OData $top — pageSize intentionally omitted.
			const { items, error } = await paginateGraphList<Channel>({
				client,
				initialUrl: `/teams/${teamId}/channels`,
				maxItems: DROPDOWN_LIST_MAX,
			});

			if (error && items.length === 0) {
				return {
					disabled: true,
					placeholder: "Couldn't load channels — please retry.",
					options: [],
				};
			}

			return {
				disabled: false,
				options: items.map((channel) => ({ label: channel.displayName!, value: channel.id! })),
			};
		},
	}),
};

const DROPDOWN_LIST_MAX = 500;
