import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowRegisterHostedScriptOutputSchema } from '../../../output-schemas';

export const registerInlineScriptAction = createAction({
	auth: webflowAuth,
	name: 'webflow_register_inline_script',
	outputSchema: webflowRegisterHostedScriptOutputSchema,
	displayName: 'Register Inline Script',
	description: 'Registers an inline script, hosted by Webflow, to a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Registers JavaScript source code (up to 2000 characters) that Webflow hosts, and returns its id and version. Registering does not apply it: pass the id and version to Upsert Site Custom Code or Upsert Page Custom Code. For a script at an external URL, use Register Hosted Script. Get the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: 'Name of the script, 1-50 alphanumeric characters.',
			required: true,
		}),
		version: Property.ShortText({
			displayName: 'Version',
			description: 'Semantic version of the script, e.g. "1.0.0".',
			required: true,
		}),
		sourceCode: Property.LongText({
			displayName: 'Source Code',
			description: 'The JavaScript to host, without <script> tags. Up to 2000 characters.',
			required: true,
		}),
		integrityHash: Property.ShortText({
			displayName: 'Integrity Hash',
			description: 'Optional Sub-Resource Integrity hash of the script, e.g. "sha384-...".',
			required: false,
		}),
		canCopy: webflowAiProps.flag({
			required: false,
			displayName: 'Can Copy',
			description: 'Whether the script is copied when the site is duplicated or transferred. Webflow defaults to No.',
		}),
	},
	async run(context) {
		const { siteId, displayName, version, sourceCode, integrityHash, canCopy } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/registered_scripts/inline`,
			body: {
				displayName,
				version,
				sourceCode,
				...(integrityHash ? { integrityHash } : {}),
				...(canCopy !== undefined ? { canCopy: canCopy === 'true' } : {}),
			},
		});
	},
});
