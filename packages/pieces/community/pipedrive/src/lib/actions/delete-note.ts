import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteNoteActionOutputSchema } from '../output-schemas';

export const deleteNoteAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-note',
	outputSchema: deleteNoteActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Note',
	description: 'Deletes a note.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one note by numeric ID; it cannot be restored via this piece. To change a note\'s text or pins instead, use Update Note. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		noteId: Property.Number({
			displayName: 'Note ID',
			description: 'The numeric ID of the note to delete (from Find Notes).',
			required: true,
		}),
	},
	async run(context) {
		const { noteId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<boolean>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v1/notes/${noteId}`,
			resourceLabel: `Note ${noteId}`,
		});
	},
});
