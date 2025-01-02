import { hubspotAuth } from '../../';
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
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { formDropdown } from '../common/props';

type Props = {
	formId: string;
};

type FormSubmissionResponse = {
	results: Array<{
		conversionId: string;
		submittedAt: number;
		pageUrl: string;
		values: Array<{ name: string; value: string }>;
	}>;
	paging?: {
		next?: {
			after: string;
		};
	};
};

type FormField = {
	name: string;
	label: string;
	fieldType: string;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
		const formId = propsValue.formId;

		const submissions = [];
		let after;
		do {
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
					token: authValue.access_token,
				},
			});
			after = response.body.paging?.next?.after;
			submissions.push(...response.body.results);
		} while (after);

		const formFields = await httpClient.sendRequest<FormField[]>({
			method: HttpMethod.GET,
			url: `https://api.hubapi.com/forms/v2/fields/${formId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: authValue.access_token,
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
					if (fieldType === 'checkbox') {
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

		return items.map((item) => ({
			epochMilliSeconds: item.submittedAt,
			data: item,
		}));
	},
};

export const newFormSubmissionTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-form-submission',
	displayName: 'New Form Submission',
	description: 'Triggers when a form is submitted.',
	type: TriggerStrategy.POLLING,
	props: {
		formId: formDropdown,
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
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
