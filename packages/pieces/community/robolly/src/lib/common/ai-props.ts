import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function templateId<R extends boolean>({
	required,
	displayName = 'Template ID',
	description = 'The template ID, e.g. "6416bcbab241242aa0b22ecb". Use List Templates to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function modifications<R extends boolean>({
	required,
	displayName = 'Modifications',
	description = 'Element values keyed by element name, e.g. {"title": "Hello", "image": "https://…/photo.jpg"}. Use "<element>.<property>" keys for detailed changes, e.g. {"title.textColor": "red"}. Use List Template Elements to get the keys.',
}: PropParams<R>) {
	return Property.Object({ displayName, description, required });
}

function templateFields() {
	return {
		artboardWidth: Property.Number({
			displayName: 'Width',
			description: 'Canvas width in pixels.',
			required: false,
		}),
		artboardHeight: Property.Number({
			displayName: 'Height',
			description: 'Canvas height in pixels.',
			required: false,
		}),
		backgroundColor: Property.ShortText({
			displayName: 'Background Color',
			description: 'Canvas background color as a CSS color, e.g. "rgb(27, 61, 166)" or "#1b3da6".',
			required: false,
		}),
		path: Property.ShortText({
			displayName: 'Folder Path',
			description:
				'An existing folder in the Robolly dashboard to list the template under. Robolly rejects a folder that does not exist.',
			required: false,
		}),
		renderFileName: Property.ShortText({
			displayName: 'Render File Name',
			description: 'The file name given to rendered files.',
			required: false,
		}),
		disallowNotSigned: Property.StaticDropdown({
			displayName: 'Require Signed Render Links',
			description:
				'Yes rejects render links that have neither a signature nor an API key. Leave empty to keep the current setting.',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
	};
}

export const robollyAiProps = { templateId, modifications, templateFields };
