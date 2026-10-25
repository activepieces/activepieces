import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import {
	Action,
	AppConnectionType,
	AppConnectionValueForAuthProperty,
	createMockActionContext,
	InputPropertyMap,
	PropertyType,
	StaticPropsValue,
} from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../src/lib/auth';
import { brevoCommon } from '../src/lib/common';
import { createOrUpdateEmailTemplate } from '../src/lib/actions/create-or-update-email-template';
import { updateContact } from '../src/lib/actions/update-contact';

const AUTH: AppConnectionValueForAuthProperty<typeof sendinblueAuth> = {
	type: AppConnectionType.SECRET_TEXT,
	secret_text: 'test-key',
};

let requests: HttpRequest[] = [];

beforeEach(() => {
	requests = [];
	vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
		requests.push(request);
		return { status: 200, headers: {}, body: {} };
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('brevoCommon.optionalBooleanValue', () => {
	it.each([true, 'yes', ' Yes ', 'TRUE', 'true'])('reads %j as true', (value) => {
		expect(brevoCommon.optionalBooleanValue(value)).toBe(true);
	});

	it.each([false, 'no', 'NO', ' False '])('reads %j as false', (value) => {
		expect(brevoCommon.optionalBooleanValue(value)).toBe(false);
	});

	it.each([undefined, null, '', 'unchanged', 'maybe', 1])('reads %j as leave unchanged', (value) => {
		expect(brevoCommon.optionalBooleanValue(value)).toBeUndefined();
	});
});

describe('agent-facing boolean props', () => {
	it.each([
		[updateContact.props.email_blacklisted],
		[updateContact.props.sms_blacklisted],
		[createOrUpdateEmailTemplate.props.is_active],
	])('%# is an optional Yes / No / Leave unchanged dropdown', (prop) => {
		expect(prop.type).toBe(PropertyType.STATIC_DROPDOWN);
		expect(prop.required).toBe(false);
		expect(prop.options.options.map((option) => option.value)).toEqual(['yes', 'no', 'unchanged']);
	});
});

describe('Update Contact', () => {
	const base = {
		identifier: 'pt@example.com',
		identifier_type: 'email_id',
		attributes: { FIRSTNAME: 'Renamed' },
		ext_id: undefined,
		list_ids: undefined,
		unlink_list_ids: undefined,
		blocked_sender_addresses: undefined,
	};

	it.each([undefined, 'unchanged', 'maybe'])(
		'leaves both blacklist flags out of the request for %j',
		async (flag) => {
			await run({
				action: updateContact,
				propsValue: { ...base, email_blacklisted: flag, sms_blacklisted: flag },
			});
			expect(requests).toHaveLength(1);
			expect(requests[0].body).toEqual({ attributes: { FIRSTNAME: 'Renamed' } });
		},
	);

	it('sends only the flags that are set', async () => {
		await run({
			action: updateContact,
			propsValue: { ...base, email_blacklisted: 'no', sms_blacklisted: 'unchanged' },
		});
		expect(requests[0].body).toEqual({
			attributes: { FIRSTNAME: 'Renamed' },
			emailBlacklisted: false,
		});
	});

	it.each([
		['yes', true],
		['no', false],
	])('sends both flags for %j', async (flag, expected) => {
		await run({
			action: updateContact,
			propsValue: { ...base, email_blacklisted: flag, sms_blacklisted: flag },
		});
		expect(requests[0].body).toEqual({
			attributes: { FIRSTNAME: 'Renamed' },
			emailBlacklisted: expected,
			smsBlacklisted: expected,
		});
	});
});

describe('Create or Update Email Template', () => {
	const update = {
		template_id: 7,
		template_name: undefined,
		subject: 'Edited',
		sender_email: undefined,
		sender_name: undefined,
		html_content: undefined,
		html_url: undefined,
		reply_to_email: undefined,
		to_field: undefined,
		tag: undefined,
		attachment_url: undefined,
	};

	it.each([undefined, 'unchanged'])('leaves isActive out of an update for %j', async (is_active) => {
		await run({ action: createOrUpdateEmailTemplate, propsValue: { ...update, is_active } });
		expect(requests[0].url).toBe('https://api.brevo.com/v3/smtp/templates/7');
		expect(requests[0].body).toEqual({ subject: 'Edited' });
	});

	it.each([
		['yes', true],
		['no', false],
	])('sends isActive for %j', async (is_active, expected) => {
		await run({ action: createOrUpdateEmailTemplate, propsValue: { ...update, is_active } });
		expect(requests[0].body).toEqual({ subject: 'Edited', isActive: expected });
	});

	it('leaves isActive out of a create when it is not set', async () => {
		await run({
			action: createOrUpdateEmailTemplate,
			propsValue: {
				...update,
				template_id: undefined,
				template_name: 'New',
				sender_email: 'sender@example.com',
				html_content: '<p>Hello there</p>',
				is_active: undefined,
			},
		});
		expect(requests[0].body).not.toHaveProperty('isActive');
	});
});

function run<Props extends InputPropertyMap>({
	action,
	propsValue,
}: {
	action: Action<typeof sendinblueAuth, Props>;
	propsValue: StaticPropsValue<Props>;
}): Promise<unknown> {
	return action.run({ ...createMockActionContext<Props>({ propsValue }), auth: AUTH });
}
