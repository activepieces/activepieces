import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralLibrary } from '../common/libraries';
import { libraryOutputSchema } from '../output-schemas';

export const createLibrary = createAction({
	auth: mistralAuth,
	name: 'create_library',
	classification: 'WRITE',
	displayName: 'Create Library',
	description: 'Create a document library for agents to search (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an empty Mistral document library (Beta) and returns its UUID; add files with Upload Library Document and attach the library to an agent through Create Agent or Update Agent. Owner type User makes it private, Workspace shares it with the workspace. Not idempotent: each call creates another library, even with the same name.',
		idempotent: false,
	},
	outputSchema: libraryOutputSchema,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		owner_type: Property.StaticDropdown({
			displayName: 'Owner',
			description: 'User keeps the library private; Workspace shares it with your workspace.',
			required: false,
			options: {
				options: [
					{ label: 'User (private)', value: 'User' },
					{ label: 'Workspace', value: 'Workspace' },
				],
			},
		}),
		chunk_size: Property.Number({
			displayName: 'Chunk Size',
			description: 'Characters per chunk when splitting documents, between 256 and 32768. Leave empty for the default.',
			required: false,
		}),
	},
	async run(context) {
		const { name, description, owner_type, chunk_size } = context.propsValue;
		const library = await mistralApi.call<MistralLibrary>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/libraries',
			body: mistralApi.compact({ name, description, owner_type, chunk_size }),
		});
		return libraryUtils.formatLibrary(library);
	},
});
