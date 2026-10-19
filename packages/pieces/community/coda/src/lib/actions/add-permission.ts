import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { SharePrincipal, codaPermissions } from '../common/permissions';
import { addPermissionActionOutputSchema } from '../output-schemas';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_PATTERN = /^(?=.{1,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/i;

export const addPermissionAction = createAction({
	auth: codaAuth,
	name: 'add_permission',
	classification: 'WRITE',
	displayName: 'Share Doc',
	description: 'Shares a doc with a person (by email) or with everyone at an email domain.',
	audience: 'both',
	aiMetadata: {
		description: 'Shares a Coda doc with one email address or one email domain at readonly, comment or write access, optionally without the notification email. Use only when the user asks to share the doc with that person or domain; public or workspace-wide sharing is not offered. Sharing again with the same person updates the same entry, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		principalType: Property.StaticDropdown({
			displayName: 'Share With',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{ label: 'A person (email)', value: 'email' },
					{ label: 'Everyone at a domain', value: 'domain' },
				],
			},
		}),
		principal: Property.ShortText({
			displayName: 'Email or Domain',
			description: 'For a person: their email, for example ada@example.com. For a domain: example.com.',
			required: true,
		}),
		access: Property.StaticDropdown({
			displayName: 'Access',
			required: true,
			defaultValue: 'readonly',
			options: {
				disabled: false,
				options: [
					{ label: 'Can view', value: 'readonly' },
					{ label: 'Can comment', value: 'comment' },
					{ label: 'Can edit', value: 'write' },
				],
			},
		}),
		suppressEmail: Property.Checkbox({
			displayName: 'Do Not Send Notification Email',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: addPermissionActionOutputSchema,
	async run(context) {
		const { docId, principalType, principal, access, suppressEmail } = context.propsValue;
		const value = principal.trim();
		const target = toPrincipal({ type: principalType, value });
		if (!['readonly', 'comment', 'write'].includes(access)) {
			throw new Error('Access must be readonly, comment or write.');
		}
		const token = context.auth.secret_text;
		const id = codaApi.parseDocId(docId);
		await codaApi.request({
			token,
			method: HttpMethod.POST,
			path: `${codaApi.docPath(id)}/acl/permissions`,
			operation: 'share doc',
			body: { access, principal: target, suppressEmail: suppressEmail === true },
		});
		const permission = await codaPermissions.findPermission({ token, docId: id, principal: target });
		return {
			docId: id,
			permissionId: permission?.id ?? null,
			principalType: target.type,
			principal: value,
			access: permission?.access ?? access,
		};
	},
});

function toPrincipal({ type, value }: { type: string; value: string }): SharePrincipal {
	if (type === 'email') {
		if (!EMAIL_PATTERN.test(value)) {
			throw new Error(`"${value}" is not a valid email address.`);
		}
		return { type: 'email', email: value };
	}
	if (type === 'domain') {
		if (!DOMAIN_PATTERN.test(value)) {
			throw new Error(`"${value}" is not a valid domain, for example example.com.`);
		}
		return { type: 'domain', domain: value };
	}
	throw new Error('Share With must be "email" or "domain".');
}
