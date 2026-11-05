import { Property } from '@activepieces/pieces-framework';

function pageNumber<R extends boolean>({
	required,
	displayName = 'Page Number',
	description = 'Page to return, starting at 1. Defaults to 1. Use meta.total_pages from the previous response to page through.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function pageSize<R extends boolean>({
	required,
	displayName = 'Page Size',
	description = 'Items per page (1-250). Defaults to 20.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function messagingProfileId<R extends boolean>({
	required,
	displayName = 'Messaging Profile ID',
	description = 'Messaging profile UUID. Use List Messaging Profiles to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function phoneNumberId<R extends boolean>({
	required,
	displayName = 'Phone Number ID',
	description = 'Telnyx phone number resource ID (the `id` field, not the E.164 number). Use List Phone Numbers to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function callControlId<R extends boolean>({
	required,
	displayName = 'Call Control ID',
	description = 'The `call_control_id` of an active call, returned by Dial Call or found with List Active Calls.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function connectionId<R extends boolean>({
	required,
	displayName = 'Connection ID',
	description = 'Call control application (connection) ID. Use List Call Control Applications or List Connections to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function clientState<R extends boolean>({
	required,
	displayName = 'Client State',
	description = 'Optional base64-encoded string echoed back in the webhooks this command triggers.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function commandId<R extends boolean>({
	required,
	displayName = 'Command ID',
	description = 'Optional unique ID. Telnyx ignores a repeated command with the same ID on the same call, which makes retries safe.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function participantCallControlIds<R extends boolean>({
	required,
	displayName = 'Participant Call Control IDs',
	description = 'Call control IDs of the participants to target. Leave empty to target every participant.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function optionalBoolean<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string; description: string }) {
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

export const telnyxAiProps = {
	pageNumber,
	pageSize,
	messagingProfileId,
	phoneNumberId,
	callControlId,
	connectionId,
	clientState,
	commandId,
	optionalBoolean,
	participantCallControlIds,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
