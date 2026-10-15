import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

async function getOne({ credentials, memberId }: { credentials: SmartSuiteCredentials; memberId: unknown }): Promise<Record<string, unknown>> {
	return smartSuiteClient.request<Record<string, unknown>>({
		credentials,
		method: HttpMethod.GET,
		path: `/applications/members/records/${smartSuiteClient.pathSegment({ value: memberId, label: 'Member ID' })}/`,
		operation: 'get member',
	});
}

export const getMember = createAction({
	name: 'get_member',
	classification: 'READ',
	displayName: 'Get Member',
	description: 'Gets one workspace member.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with a member picker; agents should use Get Member (by ID). Returns full name, emails, role, job title and time zone. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		memberId: smartsuiteCommon.memberDropdown({ displayName: 'Member', required: true }),
	},
	outputSchema: outputSchemas['member'],
	async run({ auth, propsValue }) {
		return getOne({ credentials: smartSuiteClient.credentialsOf(auth), memberId: propsValue.memberId });
	},
});

export const getMemberById = createAction({
	name: 'get_member_by_id',
	classification: 'READ',
	displayName: 'Get Member (by ID)',
	description: 'Gets one workspace member by member ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns one SmartSuite workspace member by member ID (the IDs found in user fields, "by" values, comment authors and List Members): full name, emails, role, job title, time zone. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		memberId: Property.ShortText({
			displayName: 'Member ID',
			description: 'The member ID. Get it from List Members.',
			required: true,
		}),
	},
	outputSchema: outputSchemas['member'],
	async run({ auth, propsValue }) {
		return getOne({ credentials: smartSuiteClient.credentialsOf(auth), memberId: propsValue.memberId });
	},
});
