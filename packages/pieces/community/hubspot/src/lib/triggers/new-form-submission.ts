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
	isNil,
	Store,
	TriggerStrategy,
	Property,
} from '@activepieces/pieces-framework';
import { formDropdown } from '../common/props';
import { hubspotPolling, TieCursor } from '../common/polling';
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
const FORM_TIE_KEY = 'formSubmissionTie';
const FORM_RESUME_KEY = 'formSubmissionResume';
const LAST_POLL_KEY = 'lastPoll';

type FormTie = TieCursor & { formId: string };

type FormResume = { formId: string; after: string };

type FormField = {
	name: string;
	label: string;
	fieldType: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const authValue = auth as HubspotAuthValue;
		const formId = propsValue.formId;

		const isTestMode = lastFetchEpochMS === 0;
		const savedTie = isTestMode ? null : await store.get<FormTie>(FORM_TIE_KEY);
		const tie = savedTie?.formId === formId ? savedTie : undefined;
		const fetched = isTestMode
			? { submissions: await fetchNewestSubmissions({ authValue, formId }), groupComplete: true }
			: await fetchSubmissionsSince({ authValue, formId, since: lastFetchEpochMS, tie, store });
		const submissions = fetched.submissions;

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

		if (!isTestMode) {
			const next = hubspotPolling.advanceTie({
				cursor: tie,
				processed: submissions.map((submission) => ({ time: submission.submittedAt, id: submission.conversionId })),
				groupComplete: fetched.groupComplete,
			});
			if (!isNil(next)) {
				await store.put<FormTie>(FORM_TIE_KEY, { ...next, formId });
				await store.put(LAST_POLL_KEY, next.time);
			}
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

async function fetchSubmissionPage({ authValue, formId, after }: { authValue: HubspotAuthValue; formId: string; after?: string }) {
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
	return { submissions: response.body.results, next: response.body.paging?.next?.after };
}

async function fetchNewestSubmissions({ authValue, formId }: { authValue: HubspotAuthValue; formId: string }): Promise<FormSubmission[]> {
	const deadline = hubspotPolling.createPollDeadline(TEST_BUDGET_MS);
	let submissions: FormSubmission[] = [];
	let reference: FormSubmission | undefined;
	let newestFirst: boolean | undefined;
	let after: string | undefined;
	for (;;) {
		const page = await fetchSubmissionPage({ authValue, formId, after });
		submissions = [...submissions, ...page.submissions];
		reference = reference ?? page.submissions[0];
		newestFirst = newestFirst ?? detectNewestFirst({ reference, page: page.submissions });
		after = page.next;
		if (newestFirst === true || !after || deadline.reached()) {
			break;
		}
	}
	return [...submissions].sort((a, b) => b.submittedAt - a.submittedAt).slice(0, TEST_SAMPLE_SIZE);
}

async function fetchSubmissionsSince({
	authValue,
	formId,
	since,
	tie,
	store,
}: {
	authValue: HubspotAuthValue;
	formId: string;
	since: number;
	tie?: FormTie;
	store: Store;
}): Promise<{ submissions: FormSubmission[]; groupComplete: boolean }> {
	const isAfterTie = hubspotPolling.tieFilter({ cursor: tie, since });
	const isNew = (submission: FormSubmission) => isAfterTie({ time: submission.submittedAt, id: submission.conversionId });
	const tieActive = tie?.time === since && (!isNil(tie.afterId) || !isNil(tie.ids));
	const savedResume = await store.get<FormResume>(FORM_RESUME_KEY);
	const resume = savedResume?.formId === formId ? savedResume : undefined;

	const deadline = hubspotPolling.createPollDeadline();
	let after: string | undefined;
	let page: { submissions: FormSubmission[]; next?: string } | undefined;
	let newestFirst: boolean | undefined;
	if (!isNil(resume)) {
		page = await fetchResumePage({ authValue, formId, after: resume.after });
		if (!isNil(page)) {
			after = resume.after;
			newestFirst = false;
		}
	}
	page = page ?? (await fetchSubmissionPage({ authValue, formId }));
	const reference = page.submissions[0];
	newestFirst = newestFirst ?? detectNewestFirst({ reference, page: page.submissions });

	let resumeFrom = after;
	let fresh: FormSubmission[] = [];
	let reachedCheckpoint = false;
	for (;;) {
		const pageFresh = page.submissions.filter(isNew);
		fresh = [...fresh, ...pageFresh];
		const pageReachesSince = page.submissions.some(
			(submission) => submission.submittedAt < since || (submission.submittedAt === since && !tieActive),
		);
		if (newestFirst === true && pageReachesSince) {
			reachedCheckpoint = true;
			break;
		}
		if (newestFirst === false && pageFresh.length === 0) {
			resumeFrom = after;
		}
		if (isNil(page.next)) {
			reachedCheckpoint = true;
			break;
		}
		if (deadline.reached()) {
			break;
		}
		after = page.next;
		page = await fetchSubmissionPage({ authValue, formId, after });
		newestFirst = newestFirst ?? detectNewestFirst({ reference, page: page.submissions });
	}
	if (!reachedCheckpoint) {
		console.warn(`[hubspot] form ${formId} submissions read stopped at the poll deadline; the rest are read on the next poll`);
	}

	if (newestFirst === false && !isNil(resumeFrom)) {
		await store.put<FormResume>(FORM_RESUME_KEY, { formId, after: resumeFrom });
	} else if (newestFirst !== false) {
		await store.delete(FORM_RESUME_KEY);
	}
	const sorted = [...fresh].sort(
		(a, b) => a.submittedAt - b.submittedAt || hubspotPolling.compareIds({ a: a.conversionId, b: b.conversionId }),
	);
	const last = sorted[sorted.length - 1];
	if (reachedCheckpoint || newestFirst === true || isNil(last)) {
		return { submissions: sorted, groupComplete: true };
	}
	const earlier = sorted.filter((submission) => submission.submittedAt < last.submittedAt);
	return earlier.length > 0 ? { submissions: earlier, groupComplete: true } : { submissions: sorted, groupComplete: false };
}

async function fetchResumePage({ authValue, formId, after }: { authValue: HubspotAuthValue; formId: string; after: string }) {
	try {
		return await fetchSubmissionPage({ authValue, formId, after });
	} catch (error) {
		console.warn(`[hubspot] form ${formId} resume cursor was rejected; reading from the start`, error);
		return undefined;
	}
}

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

export const newFormSubmissionTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-form-submission',
	classification: 'READ',
	displayName: 'New Form Submission',
	description: 'Triggers when a form is submitted. HubSpot returns submissions newest first, so if thousands arrive between two checks, a check can stop before reaching the oldest of them and those are skipped.',
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
		return await hubspotPolling.poll({ polling, context });
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
