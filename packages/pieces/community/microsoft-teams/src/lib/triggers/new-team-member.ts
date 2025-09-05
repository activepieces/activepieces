import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { ConversationMember } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftTeamsCommon } from '../common';

type Props = {
	teamId: string;
};

export const newTeamMemberTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-team-member',
	displayName: 'New Team Member',
	description: 'Fires when a new member joins a team.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		id: 'MCMjMCMjZTVmMWUxYzctNTU3ZC00YzYxLWE4NzItN2Q5N2Q2OGQ0M2IzIyMxOTpkZWZhdWx0QHRlbmFudC5vbm1pY3Jvc29mdC5jb20jIzE5OmRlZmF1bHRAdGVuYW50Lm9ubWljcm9zb2Z0LmNvbQ==',
		displayName: 'John Doe',
		roles: ['owner'],
		visibleHistoryStartDateTime: '2024-01-15T10:30:00.000Z',
		userId: 'e5f1e1c7-557d-4c61-a872-7d97d68d43b3',
		email: 'john.doe@company.com',
		tenantId: '12345678-1234-1234-1234-123456789012',
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const { teamId } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const members: ConversationMember[] = [];

		if (lastFetchEpochMS === 0) {
			// First run - get recent members
			const response: PageCollection = await client
				.api(`/teams/${teamId}/members`)
				.top(10)
				.get();

			if (response.value) {
				members.push(...response.value);
			}
		} else {
			// Subsequent runs - get all members and filter by join time
			let nextLink: string | null = `/teams/${teamId}/members`;
			
			while (nextLink) {
				const response: PageCollection = await client.api(nextLink).get();
				const allMembers = response.value as ConversationMember[];

				if (Array.isArray(allMembers)) {
					// Filter members who joined after last fetch
					const newMembers = allMembers.filter(member => {
						const memberJoinTime = dayjs(member.visibleHistoryStartDateTime).valueOf();
						return memberJoinTime > lastFetchEpochMS;
					});
					members.push(...newMembers);
				}

				nextLink = response['@odata.nextLink'] ?? null;
			}
		}

		return members.map((member: ConversationMember) => {
			return {
				epochMilliSeconds: dayjs(member.visibleHistoryStartDateTime).valueOf(),
				data: member,
			};
		});
	},
};
