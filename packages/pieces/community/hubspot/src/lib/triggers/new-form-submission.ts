import { getHubspotAccessToken, HubspotAuthValue, hubspotAuth } from '../auth';
import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import {
	createTrigger,
	TriggerStrategy,
	Property,
} from '@activepieces/pieces-framework';
import { formDropdown } from '../common/props';
import { hubspotPolling } from '../common/polling';
import { newFormSubmissionTriggerOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	formId: string;
	allowMultipleFiles: boolean;
};

type FormSubmissionResponse = {
	results: FormSubmission[];
	paging?: { next?: { after: string } };
};

type FormSubmission = {
	conversionId: string;
	submittedAt: number;
	pageUrl: string;
	values: Array<{ name: string; value: string }>;
};

const TEST_BUDGET_MS = 20_000;
const TEST_SAMPLE_SIZE = 10;

type FormField = {
	name: string;
	label: string;
	fieldType: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const authValue = auth as HubspotAuthValue;
		const formId = propsValue.formId;

		const isTestMode = lastFetchEpochMS === 0;
		const deadline = hubspotPolling.createPollDeadline(isTestMode ? TEST_BUDGET_MS : undefined);
		let submissions: FormSubmission[] = [];
		let reference: FormSubmission | undefined;
		let newestFirst: boolean | undefined;
		let after: string | undefined;
		let reachedCheckpoint = false;
		for (;;) {
			const qs: QueryParams = { limit: '50' };
			if (after) {
				qs.after = after;
			}
			const response = await httpClient.sendRequest<FormSubmissionResponse>({
				method: HttpMethod.GET,
				url: `https://api.hubapi.com/form-integrations/v1/submissions/forms/${formId}`,
				queryParams: qs,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: getHubspotAccessToken(authValue),
				},
			});
			const page = response.body.results;
			submissions = [...submissions, ...page];
			reference = reference ?? page[0];
			newestFirst = newestFirst ?? detectNewestFirst({ reference, page });
			after = response.body.paging?.next?.after;
			const pageHasOld = page.some((submission) => submission.submittedAt <= lastFetchEpochMS);
			if (newestFirst === true && (isTestMode || pageHasOld)) {
				reachedCheckpoint = true;
				break;
			}
			if (!after) {
				reachedCheckpoint = true;
				break;
			}
			if (deadline.reached()) {
				break;
			}
		}
		if (!reachedCheckpoint) {
			console.warn(`[hubspot] form ${formId} submissions read stopped at the poll deadline; the rest are read on the next poll`);
		}
		if (isTestMode) {
			submissions = [...submissions].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, TEST_SAMPLE_SIZE);
		} else if (!reachedCheckpoint && newestFirst !== true) {
			submissions = dropTrailingTies(submissions.filter((submission) => submission.submittedAt > lastFetchEpochMS));
		}

		const formFields = await httpClient.sendRequest<FormField[]>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/forms/v2/fields/${formId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(authValue),
			},
		});

		const fieldMapping = formFields.body.reduce((acc, field) => {
			acc[field.name] = { label: field.label, fieldType: field.fieldType };
			return acc;
		}, {} as Record<string, { label: string; fieldType: string }>);

		const items = [];

		for (const submission of submissions) {
			const formattedValues: Record<string, any> = {};

			const submissionData = submission.values ?? [];
			for (const fieldValue of submissionData) {
				const field = fieldMapping[fieldValue.name];

				if (field) {
					const { label, fieldType } = field;

					// return an array
					if (
						fieldType === 'checkbox' ||
						(fieldType === 'file' && propsValue.allowMultipleFiles)
					) {
						formattedValues[label] = formattedValues[label] || [];
						formattedValues[label].push(fieldValue.value);
					} else {
						formattedValues[label] = fieldValue.value;
					}
				} else {
					formattedValues[fieldValue.name] = fieldValue.value;
				}
			}
			items.push({
				...submission,
				values: formattedValues,
			});
		}

		return items
			.map((item) => ({
				epochMilliSeconds: item.submittedAt,
				data: item,
			}))
			.sort((a, b) =>
				lastFetchEpochMS === 0 ? b.epochMilliSeconds - a.epochMilliSeconds : a.epochMilliSeconds - b.epochMilliSeconds,
			);
	},
};

function detectNewestFirst({ reference, page }: { reference?: FormSubmission; page: FormSubmission[] }): boolean | undefined {
	if (!reference) {
		return undefined;
	}
	if (page.some((submission) => submission.submittedAt < reference.submittedAt)) {
		return true;
	}
	if (page.some((submission) => submission.submittedAt > reference.submittedAt)) {
		return false;
	}
	return undefined;
}

function dropTrailingTies(submissions: FormSubmission[]): FormSubmission[] {
	const sorted = [...submissions].sort((a, b) => a.submittedAt - b.submittedAt);
	const last = sorted[sorted.length - 1];
	if (!last) {
		return sorted;
	}
	const kept = sorted.filter((submission) => submission.submittedAt < last.submittedAt);
	return kept.length > 0 ? kept : sorted;
}

export const newFormSubmissionTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-form-submission',
	classification: 'READ',
	displayName: 'New Form Submission',
	description: 'Triggers when a form is submitted.',
	aiMetadata: {
		description:
			'Fires when the selected HubSpot form receives a submission. Each event represents one submission, with field values mapped to their human-readable form labels plus metadata such as submission timestamp, conversion ID, and page URL. Polls the form-integrations submissions API.',
	},
	outputSchema: newFormSubmissionTriggerOutputSchema,
	type: TriggerStrategy.POLLING,
	propertyGroups: [
		{
			key: 'form',
			display: 'section',
			label: 'Form',
			icon: 'file',
			props: ['formId'],
		},
		{
			key: 'files',
			display: 'section',
			label: 'Uploaded Files',
			icon: 'paperclip',
			props: ['allowMultipleFiles'],
		},
	],
	props: {
		formId: formDropdown,
		allowMultipleFiles: Property.Checkbox({
			displayName: 'Allow Multiple Files',
			description: 'Returns every uploaded file as a list; off keeps only the last one.',
			required: true,
			defaultValue: false,
		}),
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return hubspotPolling.sampleOldestToNewest({ items: await pollingHelper.test(polling, context) });
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		conversionId: '82800398-30af-48a0-942a-1d0623fce08c',
		submittedAt: 1735216921730,
		values: {
            "First Name": "John",
            "Last Name": "Doe",
            "Email": "john.doe@example.com",
        },
		pageUrl: 'https://share.hsforms.com/1VXAvM044Tcyaa3Y5XRQFSQsuf7d',
	},
});
