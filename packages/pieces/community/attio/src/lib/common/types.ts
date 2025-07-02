export interface ObjectResponse {
	id: {
		workspace_id: string;
		object_id: string;
	};
	api_slug: string;
	singular_noun: string;
	plural_noun: string;
	created_at: string;
}

export interface ListResponse {
	id: {
		workspace_id: string;
		list_id: string;
	};
	api_slug: string;
	created_at: string;
	name: string;

	parent_object: string[];
}

export interface AttributeResponse {
	title: string;
	description: string;
	api_slug: string;
	type: string;
	is_system_attribute: boolean;
	is_writable: boolean;
	is_required: boolean;
	is_unique: boolean;
	is_multiselect: boolean;
	is_default_value_enabled: boolean;
	is_archived: boolean;
	created_at: string;
}

export interface SelectOptionResponse {
	title: string;
	is_archived: boolean;
}

export interface WebhookResponse {
	secret: string;
	id: {
		workspace_id: string;
		webhook_id: string;
	};
}

export interface ObjectWebhookPayload {
	webhook_id: string;
	events: Array<{
		event_type: string;
		id: {
			workspace_id: string;
			object_id: string;
			record_id: string;
		};
	}>;
}

export interface ListWebhookPayload {
	webhook_id: string;
	events: Array<{
		event_type: string;
		id: {
			workspace_id: string;
			list_id: string;
			entry_id: string;
		};
		parent_object_id: string;
		parent_record_id: string;
	}>;
}
