import { describe, expect, it } from 'vitest';
import { jiraDataCenter } from '../src/index';

const ICONS = ['text', 'code', 'markdown', 'reply', 'reply-all', 'users', 'user', 'send', 'type', 'file', 'paperclip', 'tag', 'inbox', 'calendar', 'trash', 'filter', 'sliders', 'blank', 'location'];
const actions = Object.values(jiraDataCenter.actions());
const triggers = Object.values(jiraDataCenter.triggers());

describe('jira-data-center piece', () => {
	it('exposes every action and trigger under its saved name', () => {
		expect(actions.map((action) => action.name).sort()).toEqual([
			'add-watcher-to-issue',
			'add_issue_attachment',
			'add_issue_comment',
			'assign_issue',
			'create_issue',
			'custom_api_call',
			'delete_issue_comment',
			'find-user',
			'get-issue-attachment',
			'get_issue',
			'link-issues',
			'list_issue_comments',
			'search_issues',
			'transition_issue',
			'update_issue',
			'update_issue_comment',
		]);
		expect(triggers.map((trigger) => trigger.name).sort()).toEqual(['new_issue', 'updated_issue', 'updated_issue_status']);
	});

	it('keeps the prop keys that saved steps rely on', () => {
		const keys = Object.fromEntries([...actions, ...triggers].map((step) => [step.name, Object.keys(step.props).sort()]));
		expect(keys).toMatchObject({
			create_issue: ['issueFields', 'issueTypeId', 'projectId'],
			update_issue: ['changesInfo', 'issueFields', 'issueId', 'statusId'],
			get_issue: ['expand', 'issueId', 'mapNames', 'mapTransitions', 'projectId'],
			search_issues: ['jql', 'maxResults'],
			list_issue_comments: ['issueId', 'limit', 'orderBy', 'projectId'],
			update_issue_comment: ['comment', 'commentId', 'issueId', 'projectId'],
			'link-issues': ['firstIssueId', 'issueLinkTypeId', 'linkInfo', 'secondIssueId'],
			new_issue: ['filterHelp', 'jql'],
			updated_issue: ['filterHelp', 'jql'],
			updated_issue_status: ['filterHelp', 'jql'],
		});
	});

	it('groups only props that exist, with icons the builder can draw', () => {
		for (const step of [...actions, ...triggers]) {
			for (const group of step.propertyGroups ?? []) {
				expect(ICONS, `${step.name} ${group.key}`).toContain(group.icon);
				for (const prop of group.props) {
					expect(Object.keys(step.props), `${step.name} ${group.key}`).toContain(prop);
				}
			}
		}
	});

	it('gives every trigger sample data shaped like a Jira issue', () => {
		for (const trigger of triggers) {
			expect(trigger.sampleData, trigger.name).toMatchObject({ key: 'EXAMPLE-42', fields: { summary: expect.any(String), status: { name: expect.any(String) } } });
		}
	});
});
