import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowRegisterHostedScriptOutputSchema } from '../../../output-schemas';

export const registerHostedScriptAction = createAction({
	auth: webflowAuth,
	name: 'webflow_register_hosted_script',
	outputSchema: webflowRegisterHostedScriptOutputSchema,
	displayName: 'Register Hosted Script',
	description: 'Registers an externally hosted script to a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Registers a script hosted at an external URL to a site and returns its id and version. Registering does not apply it: pass the id and version to Upsert Site Custom Code or Upsert Page Custom Code. For code Webflow should host, use Register Inline Script. Get the site id from List Sites.',
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
		hostedLocation: Property.ShortText({
			displayName: 'Hosted Location',
			description: 'URL of the hosted script, e.g. "https://cdn.example.com/app.js".',
			required: true,
		}),
		integrityHash: Property.ShortText({
			displayName: 'Integrity Hash',
			description: 'Sub-Resource Integrity hash of the script, e.g. "sha384-...".',
			required: true,
		}),
		canCopy: webflowAiProps.flag({
			required: false,
			displayName: 'Can Copy',
			description: 'Whether the script is copied when the site is duplicated or transferred. Webflow defaults to No.',
		}),
	},
	async run(context) {
		const { siteId, displayName, version, hostedLocation, integrityHash, canCopy } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/registered_scripts/hosted`,
			body: {
				displayName,
				version,
				hostedLocation,
				integrityHash,
				...(canCopy !== undefined ? { canCopy: canCopy === 'true' } : {}),
			},
		});
	},
});
