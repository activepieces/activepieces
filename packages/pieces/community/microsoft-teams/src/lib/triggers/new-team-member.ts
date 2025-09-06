import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';

type Props = {
	teamId: string;
};

const SEEN_STORE_KEY_PREFIX = 'seen-members-';

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
		id: '/example-member-id',
		roles: ['member'],
		displayName: 'John Doe',
		userId: '00000000-0000-0000-0000-000000000000',
		email: 'john.doe@example.com',
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, store }) {
		const { teamId } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const storeKey = `${SEEN_STORE_KEY_PREFIX}${teamId}`;
		let seenMembers = (await store.get<Set<string>>(storeKey)) ?? new Set<string>();
		// Stored sets are serialized, so restore to a Set if needed
		if (!(seenMembers instanceof Set) && Array.isArray(seenMembers as unknown as string[])) {
			seenMembers = new Set<string>(seenMembers as unknown as string[]);
		}

		const newlyAdded: any[] = [];

		let response: PageCollection = await client.api(`/teams/${teamId}/members`).get();
		const currentIds: string[] = [];
		while (response.value && response.value.length > 0) {
			for (const member of response.value as any[]) {
				const id: string = member.id ?? member.userId ?? '';
				if (id) {
					currentIds.push(id);
					if (!seenMembers.has(id)) {
						newlyAdded.push(member);
						seenMembers.add(id);
					}
				}
			}
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		// Persist the seen ids (as array to ensure serialization)
		await store.put<string[]>(storeKey, Array.from(seenMembers));

		return newlyAdded.map((member: any) => {
			return {
				epochMilliSeconds: dayjs().valueOf(),
				data: member,
			};
		});
	},
};


