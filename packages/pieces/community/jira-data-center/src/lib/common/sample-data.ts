const BASE_URL = 'https://jira.example.com';

function sampleUser({ name, key, displayName }: { name: string; key: string; displayName: string }) {
	return {
		self: `${BASE_URL}/rest/api/2/user?username=${name}`,
		name,
		key,
		emailAddress: `${name}@example.com`,
		avatarUrls: {
			'48x48': `https://example.com/avatar/${name}.png`,
			'24x24': `https://example.com/avatar/${name}.png`,
			'16x16': `https://example.com/avatar/${name}.png`,
			'32x32': `https://example.com/avatar/${name}.png`,
		},
		displayName,
		active: true,
		timeZone: 'Etc/UTC',
	};
}

function sampleIssue({ status, updated, resolved }: { status: SampleStatus; updated: string; resolved: boolean }) {
	const reporter = sampleUser({ name: 'alice', key: 'JIRAUSER10001', displayName: 'Alice Example' });
	return {
		expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
		id: '10042',
		self: `${BASE_URL}/rest/api/2/issue/10042`,
		key: 'EXAMPLE-42',
		fields: {
			summary: 'Checkout page shows an error on submit',
			description: 'Customers see an error when they submit the checkout form.',
			status: {
				self: `${BASE_URL}/rest/api/2/status/${status.id}`,
				description: '',
				iconUrl: `${BASE_URL}/images/icons/statuses/generic.png`,
				name: status.name,
				id: status.id,
				statusCategory: {
					self: `${BASE_URL}/rest/api/2/statuscategory/${status.categoryId}`,
					id: status.categoryId,
					key: status.categoryKey,
					colorName: status.categoryColor,
					name: status.categoryName,
				},
			},
			issuetype: {
				self: `${BASE_URL}/rest/api/2/issuetype/10004`,
				id: '10004',
				description: 'A problem or error.',
				iconUrl: `${BASE_URL}/secure/viewavatar?size=xsmall&avatarId=10303&avatarType=issuetype`,
				name: 'Bug',
				subtask: false,
				avatarId: 10303,
			},
			priority: {
				self: `${BASE_URL}/rest/api/2/priority/2`,
				iconUrl: `${BASE_URL}/images/icons/priorities/high.svg`,
				name: 'High',
				id: '2',
			},
			project: {
				self: `${BASE_URL}/rest/api/2/project/10000`,
				id: '10000',
				key: 'EXAMPLE',
				name: 'Example Project',
				projectTypeKey: 'software',
			},
			assignee: sampleUser({ name: 'bob', key: 'JIRAUSER10002', displayName: 'Bob Example' }),
			reporter,
			creator: reporter,
			labels: ['checkout', 'customer-reported'],
			created: '2024-01-15T09:00:00.000+0000',
			updated,
			duedate: '2024-01-22',
			resolutiondate: resolved ? updated : null,
			resolution: resolved
				? {
						self: `${BASE_URL}/rest/api/2/resolution/10000`,
						id: '10000',
						description: 'Work has been completed on this issue.',
						name: 'Done',
				  }
				: null,
			fixVersions: [],
			components: [],
			issuelinks: [],
			subtasks: [],
		},
	};
}

const TO_DO: SampleStatus = {
	id: '10000',
	name: 'To Do',
	categoryId: 2,
	categoryKey: 'new',
	categoryColor: 'default',
	categoryName: 'To Do',
};

const IN_PROGRESS: SampleStatus = {
	id: '3',
	name: 'In Progress',
	categoryId: 4,
	categoryKey: 'indeterminate',
	categoryColor: 'inprogress',
	categoryName: 'In Progress',
};

const DONE: SampleStatus = {
	id: '10001',
	name: 'Done',
	categoryId: 3,
	categoryKey: 'done',
	categoryColor: 'success',
	categoryName: 'Done',
};

export const jiraSampleData = {
	newIssue: sampleIssue({ status: TO_DO, updated: '2024-01-15T09:00:00.000+0000', resolved: false }),
	updatedIssue: sampleIssue({ status: IN_PROGRESS, updated: '2024-01-16T14:30:00.000+0000', resolved: false }),
	updatedIssueStatus: sampleIssue({ status: DONE, updated: '2024-01-18T11:20:00.000+0000', resolved: true }),
};

type SampleStatus = {
	id: string;
	name: string;
	categoryId: number;
	categoryKey: string;
	categoryColor: string;
	categoryName: string;
};
