import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function pageId<R extends boolean>({
	required,
	displayName = 'Page ID',
	description = 'Facebook Page ID, e.g. "104857839123456". Use List Pages to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function formId<R extends boolean>({
	required,
	displayName = 'Form ID',
	description = 'Lead form ID, e.g. "1234567890123456". Use List Lead Forms to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const facebookLeadsAiProps = { pageId, formId };
