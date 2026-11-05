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
	description = 'Select your template. (If you want to use Template ID. Click on the "(x)" above this field. Template ID can be found by opening a template and going to “Render”. Being there copy the template ID from the top right.)',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: robollyAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Enter your API key first' });
			}
			const { data: options, error } = await tryCatch(async () => {
				const templates = await robollyApi.listTemplates({ auth });
				return templates.map((template) => ({ label: template.name, value: template.id }));
			});
			if (error) {
				return disabledOptions({ placeholder: "Couldn't load templates, API key is invalid" });
			}
			return { disabled: false, options };
		},
	});
}

function templateFields<R extends boolean>({
	required,
	displayName = 'Values',
	description = 'The values to apply to the fields in the template.',
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
