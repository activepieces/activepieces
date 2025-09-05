import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { ConversationMember } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

import { isNil } from '@activepieces/shared';

type Props = {
	teamId: string;
};

export const newTeamMemberTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-team-member',
	displayName: 'New Team Member',
	description: 'Triggers when a new member joins a team.',
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
		'@odata.type': '#microsoft.graph.aadUserConversationMember',
		id: 'ZWUwZjVhZTItOGJjNi00YWU1LTg0NjYtN2RhZWViYmZhMDYyIyM3Mzc2MWYwNi0yYWM5LTQ2OWMtOWYxMC0yNzlhOGNjMjY3Zjk=',
		roles: [],
		displayName: 'Adele Vance',
		userId: '73761f06-2ac9-469c-9f10-279a8cc267f9',
		email: 'AdeleV@contoso.com',
		visibleHistoryStartDateTime: '2021-04-27T19:31:25.477Z',
		tenantId: 'b33cbe9f-8ebe-4f2a-912b-7e2a427f477f',
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const { teamId } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const members: ConversationMember[] = [];

		// Get all team members
		// Note: Microsoft Graph doesn't support delta queries for team members, so we'll use regular polling
		let response: PageCollection = await client
			.api(`/teams/${teamId}/members`)
			.select('id,displayName,userId,email,roles,visibleHistoryStartDateTime,tenantId')
			.get();

		const allMembers: ConversationMember[] = [];
		
		// Handle pagination
		while (response.value.length > 0) {
			allMembers.push(...response.value);
			
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		if (lastFetchEpochMS === 0) {
			// First run: return the most recent 3 members to avoid overwhelming
			// Sort by visibleHistoryStartDateTime (when they joined) and take the most recent
			const sortedMembers = allMembers
				.filter((member: ConversationMember) => member.visibleHistoryStartDateTime)
				.sort((a: ConversationMember, b: ConversationMember) => {
					const dateA = new Date(a.visibleHistoryStartDateTime!).getTime();
					const dateB = new Date(b.visibleHistoryStartDateTime!).getTime();
					return dateB - dateA; // Most recent first
				});
			
			members.push(...sortedMembers.slice(0, 3));
		} else {
			// Subsequent runs: compare with stored member list to find new members
			const storedMemberIds = (await store.get<string[]>('memberIds')) || [];
			const currentMemberIds = allMembers.map((member: ConversationMember) => member.id!);
			
			// Find new member IDs that weren't in the previous fetch
			const newMemberIds = currentMemberIds.filter(id => !storedMemberIds.includes(id));
			
			// Get the full member objects for new members
			const newMembers = allMembers.filter((member: ConversationMember) => 
				newMemberIds.includes(member.id!)
			);
			
			members.push(...newMembers);
			
			// Store current member IDs for next comparison
			await store.put<string[]>('memberIds', currentMemberIds);
		}

		return members.map((member: ConversationMember) => {
			// Use visibleHistoryStartDateTime as the timestamp (when they joined)
			// If not available, use current time as fallback
			const joinTime = member.visibleHistoryStartDateTime 
				? dayjs(member.visibleHistoryStartDateTime).valueOf()
				: dayjs().valueOf();
				
			return {
				epochMilliSeconds: joinTime,
				data: member,
			};
		});
	},
};