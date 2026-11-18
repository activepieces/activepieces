import { describe, expect, it } from 'vitest';
import { PropertyType } from '@activepieces/pieces-framework';
import { jiraServiceManagement } from '../src/index';

const ICONS = ['text', 'code', 'markdown', 'reply', 'reply-all', 'users', 'user', 'send', 'type', 'file', 'paperclip', 'tag', 'inbox', 'calendar', 'trash', 'filter', 'sliders', 'blank'];
const actions = Object.values(jiraServiceManagement.actions());
const triggers = Object.values(jiraServiceManagement.triggers());
const handWritten = actions.filter((action) => action.name !== 'custom_api_call');

describe('jira-service-management piece', () => {
	it('exposes the planned actions and trigger', () => {
		expect(actions.map((action) => action.name).sort()).toEqual([
			'add_comment',
			'add_customers_to_service_desk',
			'add_organization_to_service_desk',
			'add_request_participants',
			'answer_approval',
			'create_customer',
			'create_organization',
			'create_request',
			'custom_api_call',
			'find_requests',
			'get_request',
			'list_queue_requests',
			'transition_request',
		]);
		expect(triggers.map((trigger) => trigger.name)).toEqual(['new_request']);
	});

	it('tags every action for agents and the piece selector', () => {
		for (const action of handWritten) {
			expect(action.audience, action.name).toBe('both');
			expect(action.aiMetadata?.description?.length ?? 0, action.name).toBeGreaterThan(40);
			expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
			expect(action.classification, action.name).toMatch(/^(READ|SEARCH|WRITE)$/);
			expect(action.outputSchema, action.name).toBeDefined();
		}
		for (const trigger of triggers) {
			expect(trigger.classification).toBe('READ');
			expect(trigger.aiMetadata?.description).toBeTruthy();
			expect(trigger.sampleData).toBeTruthy();
		}
	});

	it('keeps groups, icons and Advanced flags valid for the step form', () => {
		for (const step of [...handWritten, ...triggers]) {
			const propNames = Object.keys(step.props);
			const grouped = (step.propertyGroups ?? []).flatMap((group) => group.props);
			for (const group of step.propertyGroups ?? []) {
				expect(group.display, `${step.name}.${group.key}`).toBe('section');
				expect(ICONS, `${step.name}.${group.key}`).toContain(group.icon);
				for (const name of group.props) {
					expect(propNames, `${step.name}.${group.key}`).toContain(name);
				}
			}
			for (const [name, prop] of Object.entries(step.props)) {
				if (prop.advanced === true) {
					expect(prop.required, `${step.name}.${name}`).toBe(false);
					expect(grouped, `${step.name}.${name}`).not.toContain(name);
				}
				if (prop.type === PropertyType.STATIC_DROPDOWN && prop.display === 'cards') {
					expect(prop.options.options.length, `${step.name}.${name}`).toBeLessThanOrEqual(4);
					for (const option of prop.options.options) {
						expect(ICONS, `${step.name}.${name}`).toContain(option.icon);
					}
				}
			}
		}
	});
});
