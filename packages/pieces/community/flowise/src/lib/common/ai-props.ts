import { Property } from '@activepieces/pieces-framework';

function chatflowId<R extends boolean>({
	required,
	displayName = 'Chatflow ID',
	description = 'ID of the chatflow (agentflow or assistant flow). Use List Chatflows to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function chatId<R extends boolean>({
	required,
	displayName = 'Chat ID',
	description = 'ID of one chat session, returned as `chatId` by Make Prediction and List Chat Messages.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function storeId<R extends boolean>({
	required,
	displayName = 'Document Store ID',
	description = 'ID of the document store. Use List Document Stores to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function loaderId<R extends boolean>({
	required,
	displayName = 'Loader ID',
	description = 'ID of a document loader inside the store, from the `loaders` array of Get Document Store.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function startDate<R extends boolean>({
	required,
	displayName = 'Start Date',
	description = 'Only include records created on or after this date (ISO 8601).',
}: PropParams<R>) {
	return Property.DateTime({ displayName, description, required });
}

function endDate<R extends boolean>({
	required,
	displayName = 'End Date',
	description = 'Only include records created on or before this date (ISO 8601).',
}: PropParams<R>) {
	return Property.DateTime({ displayName, description, required });
}

function yesNo<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.StaticDropdown<boolean, R>({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: true },
				{ label: 'No', value: false },
			],
		},
	});
}

export const flowiseAiProps = { chatflowId, chatId, storeId, loaderId, startDate, endDate, yesNo };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
