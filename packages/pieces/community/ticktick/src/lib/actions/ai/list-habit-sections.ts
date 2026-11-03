import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListHabitSectionsOutputSchema } from '../../output-schemas';

export const listHabitSectionsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_habit_sections',
	outputSchema: ticktickListHabitSectionsOutputSchema,
	displayName: 'List Habit Sections',
	description: 'Lists the habit sections (such as morning, afternoon, night) of the connected account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists habit sections with their ids. Use to get the sectionId for ticktick_create_habit or ticktick_update_habit. Read-only.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const sections = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/habit/sections',
		});
		return { sections, count: sections.length };
	},
});
