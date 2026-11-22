import {
	DropdownState,
	DynamicPropsValue,
	Property,
	tryCatch,
} from '@activepieces/pieces-framework';

import { robollyAuth } from '../auth';
import { robollyApi } from './api';

function templateId<R extends boolean>({
	required,
	displayName = 'Template',
	description = "Pick a template, or map its ID from the template's Render page.",
}: PropParams<R>) {
	return Property.Dropdown({
		auth: robollyAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your Robolly account first' });
			}
			const { data: options, error } = await tryCatch(async () => {
				const templates = await robollyApi.listTemplates({ auth });
				return templates.map((template) => ({ label: template.name, value: template.id }));
			});
			if (error) {
				return disabledOptions({ placeholder: "Couldn't load templates. Check your connection." });
			}
			if (options.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No templates found. Create one in Robolly first.',
				};
			}
			return { disabled: false, options };
		},
	});
}

function templateFields<R extends boolean>({
	required,
	displayName = 'Values',
	description = 'One input per field in the template you picked.',
}: PropParams<R>) {
	return Property.DynamicProperties({
		auth: robollyAuth,
		displayName,
		description,
		required,
		refreshers: ['template_id'],
		props: async ({ auth, template_id }): Promise<DynamicPropsValue> => {
			if (!auth) return {};
			if (!template_id) return {};
			const modifications = await robollyApi.listAcceptedModifications({
				auth,
				templateId: String(template_id),
			});
			return Object.fromEntries(
				modifications.map((field) => [
					field.key,
					Property.ShortText({
						displayName: field.key,
						description: `Type: ${field.type}`,
						required: false,
					}),
				]),
			);
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const robollyProps = { templateId, templateFields };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
