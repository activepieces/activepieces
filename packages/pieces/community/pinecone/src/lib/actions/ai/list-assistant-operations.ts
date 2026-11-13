import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeListAssistantOperationsOutputSchema } from '../../output-schemas';

export const pineconeListAssistantOperationsAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_list_assistant_operations',
	outputSchema: pineconeListAssistantOperationsOutputSchema,
	displayName: 'List Assistant Operations',
	description: 'Lists file processing operations of an assistant.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists an assistant's file operations (uploads, replacements, deletions) with status, one page at a time, optionally filtered by type or status. Pass the returned pagination token with the same filters for the next page.",
		idempotent: true,
	},
	props: {
		assistantName: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Name of the assistant, from List Assistants.',
			required: true,
		}),
		operationType: Property.StaticDropdown({
			displayName: 'Operation Type',
			description:
				'Only list this type: upload_file, upsert_file, delete_file or update_file_metadata.',
			required: false,
			options: {
				options: [
					{ label: 'Upload File', value: 'upload_file' },
					{ label: 'Upsert File', value: 'upsert_file' },
					{ label: 'Delete File', value: 'delete_file' },
					{ label: 'Update File Metadata', value: 'update_file_metadata' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only list this status: Processing, Completed or Failed.',
			required: false,
			options: {
				options: [
					{ label: 'Processing', value: 'Processing' },
					{ label: 'Completed', value: 'Completed' },
					{ label: 'Failed', value: 'Failed' },
				],
			},
		}),
		limit: pineconeAiProps.limit({
			required: false,
			description: 'Maximum number of items to return, 1-100. Defaults to 100.',
		}),
		paginationToken: pineconeAiProps.paginationToken({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const assistant = client.assistant({ name: p.assistantName });
		return await assistant.listOperations({
			...(p.operationType !== undefined ? { operationType: p.operationType } : {}),
			...(p.status !== undefined ? { status: p.status } : {}),
			...(p.limit !== undefined ? { limit: p.limit } : {}),
			...(p.paginationToken !== undefined ? { paginationToken: p.paginationToken } : {}),
		});
	},
});
