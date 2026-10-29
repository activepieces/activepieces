import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { fieldOutputSchema } from '../../output-schemas';

export const updateFieldAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_update_field',
	outputSchema: fieldOutputSchema,
	displayName: 'Update Field',
	description: "Changes a custom field's label, tag or fallback.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes the label, tag or fallback of a text, number or date custom field on an EmailOctopus list. Only what you pass changes; the rest is kept. The API can't change a field's type or update choice fields. Renaming the tag breaks repeats, since the old tag no longer exists.",
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		tag: Property.ShortText({
			displayName: 'Field Tag',
			description: 'The current tag of the field. Use Get List to see the fields.',
			required: true,
		}),
		newLabel: Property.ShortText({
			displayName: 'New Label',
			description: 'A new label.',
			required: false,
		}),
		newTag: Property.ShortText({
			displayName: 'New Tag',
			description: 'A new tag (key) for the field.',
			required: false,
		}),
		newFallback: Property.ShortText({
			displayName: 'New Fallback',
			description: 'A new default value shown in campaigns when a contact has no value.',
			required: false,
		}),
	},
	async run(context) {
		const { listId, tag, newLabel, newTag, newFallback } = context.propsValue;
		const list = await emailOctopusApi.getList({ auth: context.auth, listId });
		const current = list.fields.find((field) => field.tag === tag);
		if (!current) {
			throw new Error(`No field with tag "${tag}" on list ${listId}.`);
		}
		return await emailOctopusApi.updateField({
			auth: context.auth,
			listId,
			tag,
			field: {
				label: newLabel ?? current.label,
				tag: newTag ?? current.tag,
				type: current.type,
				...(newFallback !== undefined
					? { fallback: newFallback }
					: current.fallback
					? { fallback: current.fallback }
					: {}),
			},
		});
	},
});
