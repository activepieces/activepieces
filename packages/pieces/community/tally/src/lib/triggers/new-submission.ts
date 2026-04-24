import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { formsDropdown } from '../common/props';
import type {
	TallyField,
	TallyQuestionField,
	TallyQuestionOption,
	TallyWebhookPayload,
} from '../common/types';

const TRIGGER_KEY = 'new_submission';

export const newSubmissionTrigger = createTrigger({
	name: 'new-submission',
	displayName: 'New Submission',
	auth: tallyAuth,
	description: 'Triggers when a form receives a new submission',
	props: {
		form_id: formsDropdown,
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
		responseId: 'resp_001',
		submissionId: 'sub_001',
		respondentId: 'resp_001',
		formId: 'form_001',
		formName: 'Contact Form',
		createdAt: '2024-01-01T00:00:00.000Z',
		fields: {
			'Your Name': 'John Doe',
			'Your Email': 'john@example.com',
			'Which plan?': 'Professional',
		},
	},
	async onEnable(context) {
		const webhookId = await tallyApiClient.createWebhook({
			apiKey: context.auth.secret_text,
			formId: context.propsValue.form_id,
			webhookUrl: context.webhookUrl,
		});
		await context.store.put(TRIGGER_KEY, { webhookId });
	},
	async onDisable(context) {
		const stored = await context.store.get<{ webhookId: string }>(TRIGGER_KEY);
		if (stored?.webhookId) {
			await tallyApiClient.deleteWebhook({
				apiKey: context.auth.secret_text,
				webhookId: stored.webhookId,
			});
		}
	},
	async test(context) {
		const { questions, submissions } = await tallyApiClient.fetchRecentSubmissions({
			apiKey: context.auth.secret_text,
			formId: context.propsValue.form_id,
		});

		const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));

		return submissions.map((submission) => ({
			responseId: submission.id,
			submissionId: submission.id,
			respondentId: submission.respondentId,
			formId: submission.formId,
			formName: '',
			createdAt: submission.submittedAt,
			fields: buildSubmissionFields({ submission, questionById }),
		}));
	},

	async run(context) {
		const body = context.payload.body as TallyWebhookPayload;
		if (body.eventType !== 'FORM_RESPONSE') return [];
		return [{ ...body.data, fields: buildWebhookFields(body.data?.fields ?? []) }];
	},
});

function buildSubmissionFields({
	submission,
	questionById,
}: {
	submission: { responses: { questionId: string; answer: unknown }[] };
	questionById: Record<string, { type: string; title: string; fields?: TallyQuestionField[] }>;
}): Record<string, unknown> {
	const fields: Record<string, unknown> = {};
	const seen: Record<string, number> = {};

	for (const response of submission.responses) {
		const question = questionById[response.questionId];
		const label = question?.title ?? response.questionId;
		const count = seen[label] ?? 0;
		seen[label] = count + 1;
		const key = count === 0 ? label : `${label} (${count + 1})`;

		switch (question?.type) {
			case 'MATRIX':
				fields[key] = isPlainObject(response.answer)
					? buildMatrixObject({
							value: response.answer,
							rowEntries: (question.fields ?? []).map((f) => ({
							id: f.uuid,
							text: stripQuestionPrefix({ title: f.title, questionTitle: question.title }),
						})),
					  })
					: response.answer;
				break;
			default:
				fields[key] = response.answer;
		}
	}

	return fields;
}

function buildWebhookFields(rawFields: TallyField[]): Record<string, unknown> {
	const fields: Record<string, unknown> = {};
	const seen: Record<string, number> = {};

	for (const field of rawFields) {
		// Sub-fields (per-option booleans) have no options array — skip them.
		if (field.type === 'CHECKBOXES' && !field.options) continue;

		const count = seen[field.label] ?? 0;
		seen[field.label] = count + 1;
		const key = count === 0 ? field.label : `${field.label} (${count + 1})`;

		switch (field.type) {
			case 'MULTIPLE_CHOICE':
			case 'CHECKBOXES':
			case 'DROPDOWN':
			case 'MULTI_SELECT':
			case 'RANKING':
				fields[key] = resolveOptions(field.value, field.options);
				break;
			case 'MATRIX':
				fields[key] = isPlainObject(field.value)
					? buildMatrixObject({
							value: field.value,
							rowEntries: field.rows ?? [],
							colEntries: field.columns ?? [],
					  })
					: field.value;
				break;
			default:
				fields[key] = field.value;
		}
	}

	return fields;
}

function buildMatrixObject({
	value,
	rowEntries,
	colEntries = [],
}: {
	value: Record<string, unknown>;
	rowEntries: { id: string; text: string }[];
	colEntries?: { id: string; text: string }[];
}): Record<string, unknown> {
	const rowTextById = Object.fromEntries(rowEntries.map((r) => [r.id, r.text]));
	const colTextById = Object.fromEntries(colEntries.map((c) => [c.id, c.text]));
	const result: Record<string, unknown> = {};

	for (const [rowId, colIds] of Object.entries(value)) {
		result[rowTextById[rowId] ?? rowId] = Array.isArray(colIds)
			? colIds.map((id) => colTextById[id] ?? id)
			: colIds;
	}

	return result;
}

// Submissions API wraps row titles as "{questionTitle} [Row 1]" — extract just "Row 1".
function stripQuestionPrefix({ title, questionTitle }: { title: string; questionTitle: string }): string {
	const prefix = `${questionTitle} [`;
	return title.startsWith(prefix) && title.endsWith(']') ? title.slice(prefix.length, -1) : title;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveOptions(value: unknown, options?: TallyQuestionOption[]): unknown {
	if (!options || options.length === 0 || !Array.isArray(value)) return value;
	const optionMap = Object.fromEntries(options.map((o) => [o.id, o.text]));
	return (value as string[]).map((id) => optionMap[id] ?? id);
}
