import { createAction } from '@activepieces/pieces-framework';

import { mauticGetNoteOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetNoteAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_note',
	outputSchema: mauticGetNoteOutputSchema,
	displayName: 'Get Note',
	description: 'Gets one Mautic note by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single note by its numeric id.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Note Id',
			description: 'Numeric note id, from List Notes or Create Note.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'notes',
			id: context.propsValue.id,
		});
	},
});
