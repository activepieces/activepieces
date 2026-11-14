import { describe, expect, it } from 'vitest';
import { PropertyType } from '@activepieces/pieces-framework';
import { RequestTypeField, jsmRequestFields } from '../src/lib/common/request-fields';

const cloud = { deployment: 'cloud', instanceUrl: 'https://acme.atlassian.net', email: 'agent@acme.test', apiToken: 'tok' };
const dataCenter = { deployment: 'data_center', instanceUrl: 'https://jira.acme.test', apiToken: 'pat' };

const summary: RequestTypeField = { fieldId: 'summary', name: 'Summary', required: true, jiraSchema: { type: 'string', system: 'summary' } };
const description: RequestTypeField = { fieldId: 'description', name: 'Details', required: false, jiraSchema: { type: 'string', system: 'description' } };
const attachment: RequestTypeField = { fieldId: 'attachment', name: 'Attachment', required: false, jiraSchema: { type: 'array', items: 'attachment', system: 'attachment' } };
const priority: RequestTypeField = {
	fieldId: 'priority',
	name: 'Urgency',
	required: false,
	jiraSchema: { type: 'priority', system: 'priority' },
	validValues: [{ value: '2', label: 'High' }, { value: '3', label: 'Medium' }],
};
const components: RequestTypeField = {
	fieldId: 'components',
	name: 'System',
	required: true,
	jiraSchema: { type: 'array', items: 'component', system: 'components' },
	validValues: [{ value: '10000', label: 'Active Directory' }],
};
const dueDate: RequestTypeField = { fieldId: 'duedate', name: 'Due', required: false, jiraSchema: { type: 'date', system: 'duedate' } };
const startAt: RequestTypeField = { fieldId: 'customfield_1', name: 'Start', required: false, jiraSchema: { type: 'datetime', custom: 'x:datetime' } };
const count: RequestTypeField = { fieldId: 'customfield_2', name: 'Seats', required: false, jiraSchema: { type: 'number', custom: 'x:float' } };
const labels: RequestTypeField = { fieldId: 'labels', name: 'Labels', required: false, jiraSchema: { type: 'array', items: 'string', system: 'labels' } };
const owner: RequestTypeField = { fieldId: 'customfield_3', name: 'Owner', required: false, jiraSchema: { type: 'user', custom: 'x:userpicker' } };
const unknownOptional: RequestTypeField = { fieldId: 'customfield_4', name: 'Odd', required: false, jiraSchema: { type: 'sd-something' } };
const unknownRequired: RequestTypeField = { fieldId: 'customfield_5', name: 'Odd but needed', required: true, jiraSchema: { type: 'sd-something' } };

function typeOf(field: RequestTypeField) {
	return jsmRequestFields.toProperty({ auth: cloud, field })?.type;
}

describe('jsmRequestFields.toProperty', () => {
	it('maps Jira field types to the right inputs', () => {
		expect(typeOf(summary)).toBe(PropertyType.SHORT_TEXT);
		expect(typeOf(description)).toBe(PropertyType.LONG_TEXT);
		expect(typeOf(priority)).toBe(PropertyType.STATIC_DROPDOWN);
		expect(typeOf(components)).toBe(PropertyType.STATIC_MULTI_SELECT_DROPDOWN);
		expect(typeOf(dueDate)).toBe(PropertyType.DATE_TIME);
		expect(typeOf(count)).toBe(PropertyType.NUMBER);
		expect(typeOf(labels)).toBe(PropertyType.ARRAY);
		expect(typeOf(owner)).toBe(PropertyType.SHORT_TEXT);
	});

	it('skips attachments and unknown optional fields, and keeps unknown required fields as JSON', () => {
		expect(typeOf(attachment)).toBeUndefined();
		expect(typeOf(unknownOptional)).toBeUndefined();
		expect(typeOf(unknownRequired)).toBe(PropertyType.JSON);
	});

	it('carries the display name, required flag and static options', () => {
		const property = jsmRequestFields.toProperty({ auth: cloud, field: components });
		expect(property).toMatchObject({
			displayName: 'System',
			required: true,
			options: { options: [{ label: 'Active Directory', value: '10000' }] },
		});
	});
});

describe('jsmRequestFields.formatValues', () => {
	it('formats each kind the way the Jira API expects and drops blanks', async () => {
		const formatted = await jsmRequestFields.formatValues({
			auth: dataCenter,
			fields: [summary, description, attachment, priority, components, dueDate, startAt, count, labels, owner, unknownRequired],
			input: {
				summary: 'Printer is down',
				description: '',
				attachment: ['ignored'],
				priority: '2',
				components: ['10000'],
				duedate: '2026-12-31T00:00:00.000Z',
				customfield_1: '2026-12-31T10:30:00.000Z',
				customfield_2: '3',
				labels: 'vip, urgent',
				customfield_3: 'jdoe',
				customfield_5: '{"id":"7"}',
			},
		});
		expect(formatted).toEqual({
			summary: 'Printer is down',
			priority: { id: '2' },
			components: [{ id: '10000' }],
			duedate: '2026-12-31',
			customfield_1: '2026-12-31T10:30:00.000+0000',
			customfield_2: 3,
			labels: ['vip', 'urgent'],
			customfield_3: { name: 'jdoe' },
			customfield_5: { id: '7' },
		});
	});

	it('refuses a value that is not a number instead of sending null', async () => {
		await expect(jsmRequestFields.formatValues({ auth: cloud, fields: [count], input: { customfield_2: 'three' } })).rejects.toThrow(
			'"Seats" must be a number',
		);
	});

	it('references people by accountId on Cloud', async () => {
		const formatted = await jsmRequestFields.formatValues({ auth: cloud, fields: [owner], input: { customfield_3: '5b10ac8d82e05b22cc7d4ef5' } });
		expect(formatted).toEqual({ customfield_3: { accountId: '5b10ac8d82e05b22cc7d4ef5' } });
	});

	it('accepts a multi-select sent as a JSON string by a dynamic value', async () => {
		const formatted = await jsmRequestFields.formatValues({ auth: cloud, fields: [components], input: { components: '["10000","10001"]' } });
		expect(formatted).toEqual({ components: [{ id: '10000' }, { id: '10001' }] });
	});
});
