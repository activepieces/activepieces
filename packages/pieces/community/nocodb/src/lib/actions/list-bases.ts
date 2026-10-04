import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbListBasesOutputSchema } from '../output-schemas';

export const listBasesAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-list-bases',
	outputSchema: nocodbListBasesOutputSchema,
	classification: 'READ',
	displayName: 'List Bases',
	description: 'Returns the bases within the given workspace (or the instance, on self-hosted).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists bases (projects), used to resolve a Base ID before listing its tables. Pass a workspace ID from List Workspaces, or leave it unset on self-hosted instances. Idempotent read-only query.',
		idempotent: true,
	},
	props: {
		workspaceId: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'Leave unset on self-hosted instances.',
			required: false,
		}),
	},
	async run(context) {
		const { workspaceId } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.listBases(workspaceId, context.auth.props.version || 3);
	},
});
