import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { getFormulaActionOutputSchema } from '../output-schemas';

export const getFormulaAction = createAction({
	auth: codaAuth,
	name: 'get_formula',
	classification: 'READ',
	displayName: 'Get Named Formula',
	description: 'Gets the current value of a named formula.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns the current computed value of a named formula in a Coda doc (for example a total), by formula ID or name. Use List Named Formulas to find it. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		formulaIdOrName: Property.ShortText({
			displayName: 'Formula ID or Name',
			description: 'The formula ID (starts with "f-") or its exact name.',
			required: true,
		}),
	},
	outputSchema: getFormulaActionOutputSchema,
	async run(context) {
		const { docId, formulaIdOrName } = context.propsValue;
		return codaApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `${codaApi.docPath(docId)}/formulas/${codaApi.pathSegment({ value: formulaIdOrName, label: 'Formula ID or Name' })}`,
			operation: 'get formula',
		});
	},
});
