export interface FacebookPaginatedResponse<T> {
	data: T[];
	paging?: {
		next?: string;
	};
}

export interface FacebookTriggerPayloadBody {
	entry: {
		changes: {
			value: {
				form_id: string;
				leadgen_id: string;
			};
		}[];
	}[];
}

export interface FacebookPage {
	id: string;
	name: string;
	category: string;
	category_list: string[];
	access_token: string;
	tasks: string[];
}

export interface FacebookPageDropdown {
	id: string;
	accessToken: string;
}

export interface FacebookForm {
	id: string;
	locale: string;
	name: string;
	status: string;
}

export interface FacebookLead {
	field_data: Array<{ name: string; values: any[] }>;
	created_time: string;
	ad_id: string;
	ad_name: string;
	adset_id: string;
	adset_name: string;
	campaign_id: string;
	campaign_name: string;
	form_id: string;
	platform: string;
	id: string;
}
