interface AttioBaseValue {
	active_from: string | null;
	active_until: string | null;
	created_by_actor: { type: 'workspace-member' | 'api-token' | 'system' | 'app'; id: string | null } | null;
}

export type AttioAttributeValue =
	| (AttioBaseValue & { attribute_type: 'text'; value: string | null })
	| (AttioBaseValue & { attribute_type: 'number'; value: number | null })
	| (AttioBaseValue & { attribute_type: 'checkbox'; value: boolean | null })
	| (AttioBaseValue & { attribute_type: 'rating'; value: number | null })
	| (AttioBaseValue & { attribute_type: 'date'; value: string | null })
	| (AttioBaseValue & { attribute_type: 'timestamp'; value: string | null })
	| (AttioBaseValue & {
			attribute_type: 'currency';
			currency_value: number | null;
			currency_code: string | null;
	  })
	| (AttioBaseValue & {
			attribute_type: 'email-address';
			email_address: string;
			email_domain: string;
			email_root_domain: string;
			original_email_address: string;
			email_local_specifier: string;
	  })
	| (AttioBaseValue & {
			attribute_type: 'personal-name';
			first_name: string | null;
			last_name: string | null;
			full_name: string | null;
	  })
	| (AttioBaseValue & {
			attribute_type: 'phone-number';
			original_phone_number: string;
			phone_number: string;
			country_code: string | null;
	  })
	| (AttioBaseValue & { attribute_type: 'domain'; domain: string; root_domain: string })
	| (AttioBaseValue & {
			attribute_type: 'location';
			line_1: string | null;
			line_2: string | null;
			line_3: string | null;
			line_4: string | null;
			locality: string | null;
			region: string | null;
			postcode: string | null;
			country_code: string | null;
			latitude: string | null;
			longitude: string | null;
	  })
	| (AttioBaseValue & {
			attribute_type: 'select';
			option: { id: Record<string, string>; title: string; is_archived: boolean };
	  })
	| (AttioBaseValue & {
			attribute_type: 'status';
			status: { id: Record<string, string>; title: string; is_archived: boolean; celebration_enabled: boolean; target_time_in_status: unknown };
	  })
	| (AttioBaseValue & {
			attribute_type: 'record-reference';
			target_object: string;
			target_record_id: string;
	  })
	| (AttioBaseValue & {
			attribute_type: 'actor-reference';
			referenced_actor_type: 'workspace-member' | 'api-token' | 'system' | 'app';
			referenced_actor_id: string | null;
	  })
	| (AttioBaseValue & {
			attribute_type: 'interaction';
			interaction_type: 'calendar-event' | 'call' | 'chat-thread' | 'email' | 'in-person-meeting' | 'meeting';
			interacted_at: string;
			owner_actor: { type: string; id: string | null };
	  });

export interface AttioRecordResponse {
	id: {
		workspace_id: string;
		object_id: string;
		record_id: string;
	};
	created_at: string;
	values: Record<string, AttioAttributeValue[]>;
}

export interface WorkspaceMemberResponse {
	id: {
		workspace_id: string;
		workspace_member_id: string;
	};
	first_name: string | null;
	last_name: string | null;
	email_address: string;
	avatar_url: string | null;
}

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
	relationship: {
		object_slug: string;
	} | null;
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

export interface MeetingResponse {
	id: {
		workspace_id: string;
		meeting_id: string;
	};
	title: string;
	start: { datetime?: string; date?: string; timezone?: string } | null;
}

export interface CallRecordingResponse {
	id: {
		workspace_id: string;
		meeting_id: string;
		call_recording_id: string;
	};
	status: 'processing' | 'completed' | 'failed';
	created_at: string;
	web_url: string;
}

export interface CallRecordingWebhookPayload {
	webhook_id: string;
	events: Array<{
		event_type: string;
		id: {
			workspace_id: string;
			meeting_id: string;
			call_recording_id: string;
		};
		actor: {
			id: string | null;
			type: 'api-token' | 'workspace-member' | 'system' | 'app' | null;
		};
	}>;
}
