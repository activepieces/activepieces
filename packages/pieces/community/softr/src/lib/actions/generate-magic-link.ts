import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { appDomainField, appUserEmailField } from '../common/props';
import { softrOutputSchemas } from '../output-schemas';

const LINK_KEYS = ['magic_link', 'magicLink', 'link', 'url'];

function readMagicLink(body: unknown): string | null {
	if (typeof body === 'string') {
		const trimmed = body.trim().replace(/^"|"$/g, '');
		return trimmed.length > 0 ? trimmed : null;
	}
	if (typeof body !== 'object' || body === null) {
		return null;
	}
	const entries = Object.entries(body);
	const match = entries.find(([key, value]) => LINK_KEYS.includes(key) && typeof value === 'string');
	return match ? String(match[1]) : null;
}

export const generateMagicLink = createAction({
	auth: SoftrAuth,
	name: 'generateMagicLink',
	classification: 'WRITE',
	displayName: 'Generate Magic Link',
	description: 'Generates a magic login link for a user of a Softr app.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a magic login link for an existing user of a published Softr app and returns it, so you can send it another way. Needs the app domain and user email. Each call makes a new link.',
		idempotent: false,
	},
	props: {
		email: appUserEmailField,
		domain: appDomainField,
	},
	outputSchema: softrOutputSchemas.magicLink,
	async run({ auth, propsValue }) {
		const email = propsValue.email.trim();
		if (email.length === 0) {
			throw new Error('User email is required.');
		}
		const response = await softrClient.studioRequest({
			apiKey: auth.secret_text,
			domain: propsValue.domain,
			method: HttpMethod.POST,
			path: `/magic-link/generate/${encodeURIComponent(email)}`,
		});
		const magicLink = readMagicLink(response.body);
		if (magicLink === null) {
			throw new Error('Softr did not return a magic link for this user.');
		}
		return { email, magicLink };
	},
});
