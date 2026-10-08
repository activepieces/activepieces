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

export const robollyAiProps = { templateId, modifications };
