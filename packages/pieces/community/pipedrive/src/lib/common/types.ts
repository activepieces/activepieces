type GetField = {
	id: string;
	name: string;
	key:string
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

type StageWithPipelineInfo = {
	id: number;
	name: string;
	pipeline_id: number;
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

export type ListPersonsResponse =
{
	success: boolean;
	data: Record<string, unknown>[];
	additional_data: AdditionalData;
}