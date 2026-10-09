import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../../auth';
import { codaApi } from '../../common/client';
import { codaProps } from '../../common/ai-props';
import { updateDocActionOutputSchema } from '../../output-schemas';

export const updateDocAction = createAction({
	auth: codaAuth,
	name: 'update_doc',
	classification: 'WRITE',
	displayName: 'Rename Doc',
	description: 'Changes a doc\'s title and/or icon.',
	audience: 'ai',
	aiMetadata: {
		description: 'Renames a Coda doc and/or changes its icon, by doc ID or link. Give at least one of Title or Icon Name. Requires the Doc Maker role. Setting the same values again changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		iconName: Property.ShortText({
			displayName: 'Icon Name',
			description: 'A Coda icon name, for example "rocket".',
			required: false,
		}),
	},
	outputSchema: updateDocActionOutputSchema,
	async run(context) {
		const { docId, title, iconName } = context.propsValue;
		const newTitle = title?.trim();
		const newIcon = iconName?.trim();
		if (!newTitle && !newIcon) {
			throw new Error('Provide a Title or an Icon Name to change.');
		}
		const id = codaApi.parseDocId(docId);
		await codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.PATCH,
			path: codaApi.docPath(id),
			operation: 'update doc',
			body: {
				...(newTitle ? { title: newTitle } : {}),
				...(newIcon ? { iconName: newIcon } : {}),
			},
		});
		return { id, title: newTitle ?? null, iconName: newIcon ?? null };
	},
});
