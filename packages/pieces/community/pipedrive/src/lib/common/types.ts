export type GetField = {
	id: string;
	name: string;
	key:string,
	edit_flag:boolean
	field_type:"varchar"|"text"|"enum"|"set"|"varchar_auto"|"double"|"monetary"|"user"|"org"|"people"|"phone"|"time"|"int"|"timerange"|"date"|"daterange"|"address",
	options?:Array<{id:number,label:string}>
};

type AdditionalData = {
	start: number;
	limit: number;
	more_items_in_collection: boolean;
};

export type FieldsResponse = {
	success: boolean;
	data: GetField[];
	additional_data: AdditionalData;
};

export type StageWithPipelineInfo = {
	id: number;
	name: string;
	pipeline_id: number;
	pipeline_name: string;
};

export type GetStagesResponse = {
	success: boolean;
	data: StageWithPipelineInfo[];
};

export type ListDealsResponse = {
	success: boolean;
	data: Record<string, unknown>[];
	additional_data: AdditionalData;
};

export type GetDealResponse=
{
	success: boolean;
	data: Record<string, unknown>;
	additional_data: AdditionalData;
}


export type ListActivitiesResponse =
{
	success: boolean;
	data: Record<string, unknown>[];
	additional_data: AdditionalData;
}

export type PersonListResponse =
{
	success: boolean;
	data: Record<string, unknown>[];
	additional_data: AdditionalData;
}
 
export type PersonCreateResponse =
{
	success: boolean;
	data: Record<string, unknown>;
	additional_data: AdditionalData;
}

export type OrganizationCreateResponse =
{
	success: boolean;
	data: Record<string, unknown>;
	additional_data: AdditionalData;
}

export type PaginatedResponse<T> =
{
	success: boolean;
	data: T[];
	additional_data: {
		pagination: {
			start: number;
			limit: number;
			more_items_in_collection: boolean;
			next_start: number;
		};
	};
}

export type RequestParams = Record<string, string | number | string[] | undefined>;

export type WebhookCreateResponse = {
	status:string,
	success:boolean,
	data:{
		id:number
	}
}

export type LeadListResponse = {
	success: boolean;
	data: Record<string, unknown>[];
}