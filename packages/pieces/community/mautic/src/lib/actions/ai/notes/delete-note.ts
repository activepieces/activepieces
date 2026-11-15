import { createAction } from '@activepieces/pieces-framework';

import { mauticDeleteNoteOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticDeleteNoteAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_note',
	outputSchema: mauticDeleteNoteOutputSchema,
	displayName: 'Delete Note',
	description: 'Permanently deletes a Mautic note.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a note. Cannot be undone.',
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Note Id',
			description: 'Numeric note id, from List Notes or Create Note.',
		}),
	},
	async run(context) {
		return await mauticApi.deleteRecord({
			auth: context.auth,
			resource: 'notes',
			id: context.propsValue.id,
		});
	},
});
