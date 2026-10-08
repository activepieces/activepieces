import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { getControlActionOutputSchema } from '../output-schemas';

export const getControlAction = createAction({
	auth: codaAuth,
	name: 'get_control',
	classification: 'READ',
	displayName: 'Get Control',
	description: 'Gets the type and current value of a control.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns a Coda control\'s type and current value (for example a slider position or a selected option), by control ID or name. Use List Controls to find it. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		controlIdOrName: Property.ShortText({
			displayName: 'Control ID or Name',
			description: 'The control ID (starts with "ctrl-") or its exact name.',
			required: true,
		}),
	},
	outputSchema: getControlActionOutputSchema,
	async run(context) {
		const { docId, controlIdOrName } = context.propsValue;
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/controls/${codaApi.pathSegment({ value: controlIdOrName, label: 'Control ID or Name' })}`,
			operation: 'get control',
		});
	},
});
