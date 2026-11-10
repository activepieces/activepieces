import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { emailOctopusUtils } from '../../common/utils';
import { createFieldOutputSchema } from '../../output-schemas';

export const createFieldAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_create_field',
	outputSchema: createFieldOutputSchema,
	displayName: 'Create Field',
	description: 'Adds a custom field to a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a custom contact field to an EmailOctopus list. Choice fields (choice_single, choice_multiple) need Choices; other types must not have them. The field tag is what contact actions use as the key in Fields.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		label: Property.ShortText({
			displayName: 'Label',
			description: 'The human-readable label, e.g. "What is your hometown?".',
			required: true,
		}),
		tag: Property.ShortText({
			displayName: 'Tag',
			description: 'The field key used in contact Fields and in emails, e.g. "Hometown".',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'The field type.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'Number', value: 'number' },
					{ label: 'Date', value: 'date' },
					{ label: 'Single choice', value: 'choice_single' },
					{ label: 'Multiple choice', value: 'choice_multiple' },
				],
			},
		}),
		choices: Property.Array({
			displayName: 'Choices',
			description: 'The options, for choice_single and choice_multiple fields only.',
			required: false,
		}),
		fallback: Property.ShortText({
			displayName: 'Fallback',
			description: 'Default value shown in campaigns when a contact has no value.',
			required: false,
		}),
	},
	async run(context) {
		const { listId, label, tag, type, choices, fallback } = context.propsValue;
		const choiceList = emailOctopusUtils.toStringArray({ value: choices, propName: 'Choices' });
		const isChoice = type === 'choice_single' || type === 'choice_multiple';
		if (isChoice && choiceList.length === 0) {
			throw new Error('Choices is required for choice_single and choice_multiple fields.');
		}
		if (!isChoice && choiceList.length > 0) {
			throw new Error('Choices is only allowed for choice_single and choice_multiple fields.');
		}
		return await emailOctopusApi.createField({
			auth: context.auth,
			listId,
			field: {
				label,
				tag,
				type,
				...(isChoice ? { choices: choiceList } : {}),
				...(fallback ? { fallback } : {}),
			},
		});
	},
});
