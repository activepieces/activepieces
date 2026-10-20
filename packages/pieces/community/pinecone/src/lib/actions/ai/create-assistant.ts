import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeCreateAssistantOutputSchema } from '../../output-schemas';

export const pineconeCreateAssistantAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_create_assistant',
	outputSchema: pineconeCreateAssistantOutputSchema,
	displayName: 'Create Assistant',
	description: 'Creates a knowledge assistant.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an assistant that answers questions from files you add with Upload Assistant File. It starts initializing; check readiness with Get Assistant.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Assistant Name',
			description: 'Unique name, lowercase letters, digits or "-".',
			required: true,
		}),
		instructions: Property.LongText({
			displayName: 'Instructions',
			description:
				'Directions for how the assistant answers, e.g. "Answer in one paragraph and cite the policy."',
			required: false,
		}),
		metadata: Property.Json({
			displayName: 'Metadata',
			description: 'String key-value pairs to store, e.g. {"team": "support"}.',
			required: false,
		}),
		region: Property.StaticDropdown<'us' | 'eu', false>({
			displayName: 'Region',
			description: "Where the assistant's data is stored. Defaults to us.",
			required: false,
			options: {
				options: [
					{ label: 'US', value: 'us' },
					{ label: 'EU', value: 'eu' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		return await client.assistants.create({
			name: p.name,
			...(p.instructions !== undefined ? { instructions: p.instructions } : {}),
			...(p.metadata !== undefined
				? { metadata: pineconeUtils.toStringMap({ value: p.metadata, propName: 'Metadata' }) }
				: {}),
			...(p.region !== undefined ? { region: p.region } : {}),
		});
	},
});
