import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { removePermissionActionOutputSchema } from '../output-schemas';

export const removePermissionAction = createAction({
	auth: codaAuth,
	name: 'remove_permission',
	classification: 'DESTRUCTIVE',
	displayName: 'Remove Doc Sharing',
	description: 'Stops sharing a doc with a person or domain, by permission ID.',
	audience: 'both',
	aiMetadata: {
		description: 'Removes one sharing entry from a Coda doc by permission ID, so that person or domain loses access. Get the ID from List Doc Sharing. Removing an entry that is already gone succeeds without error, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		permissionId: Property.ShortText({
			displayName: 'Permission ID',
			description: 'From List Doc Sharing or Share Doc.',
			required: true,
		}),
	},
	outputSchema: removePermissionActionOutputSchema,
	async run(context) {
		const { docId, permissionId } = context.propsValue;
		const id = codaApi.parseDocId(docId);
		const permission = permissionId.trim();
		try {
			await codaApi.request({
				token: context.auth.secret_text,
				method: HttpMethod.DELETE,
				path: `${codaApi.docPath(id)}/acl/permissions/${codaApi.pathSegment({ value: permission, label: 'Permission ID' })}`,
				operation: 'remove sharing',
			});
			return { docId: id, permissionId: permission, removed: true, alreadyRemoved: false };
		} catch (error) {
			if (codaApi.statusOf(error) === 404) {
				return { docId: id, permissionId: permission, removed: true, alreadyRemoved: true };
			}
			throw error;
		}
	},
});
