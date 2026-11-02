import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { getCurrentAdmin } from '../common/client';
import { listAdminsOutputSchema } from '../output-schemas';

export const listAdminsAction = createAction({
	auth: intercomAuth,
	name: 'list_admins',
	classification: 'SEARCH',
	displayName: 'List Admins',
	description: 'Lists the admins (teammates) in the workspace.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the admins (teammates) with ID, name, email, away status and team IDs, plus the ID of the admin who owns this connection. Use to find an admin ID for replies, notes or assignments. Read-only.',
		idempotent: true,
	},
	props: {},
	outputSchema: listAdminsOutputSchema,
	async run(context) {
		const [list, me] = await Promise.all([
			intercomRequest<{ admins?: Array<Record<string, unknown>> }>({
				auth: context.auth,
				method: HttpMethod.GET,
				path: ['admins'],
				operation: 'list admins',
			}),
			getCurrentAdmin(context.auth),
		]);
		return {
			items: (list.admins ?? []).map((admin) => ({
				id: admin['id'],
				name: admin['name'] ?? null,
				email: admin['email'] ?? null,
				job_title: admin['job_title'] ?? null,
				away_mode_enabled: admin['away_mode_enabled'] === true,
				has_inbox_seat: admin['has_inbox_seat'] === true,
				team_ids: Array.isArray(admin['team_ids']) ? admin['team_ids'] : [],
			})),
			current_admin_id: String(me.id),
		};
	},
});
