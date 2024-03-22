export type Contact = {
	email: string;
	firstname: string;
	lastname: string;
	website: string;
	company: string;
	phone: string;
	address: string;
	city: string;
	state: string;
	zip: string;
};

export type RequestProperty = {
	property: string;
	value: string;
};

export type HubSpotRequest = {
	properties: RequestProperty[];
};

export type HubSpotContactsCreateOrUpdateResponse = {
	vid: string;
	isNew: boolean;
};

export type HubSpotList = {
	listId: number;
	name: string;
};

export type HubSpotListsResponse = {
	lists: HubSpotList[];
};

export type HubSpotAddContactsToListResponse = {
	updated: number[];
	discarded: number[];
	invalidVids: number[];
	invalidEmails: string[];
};

export type HubSpotAddContactsToListRequest = {
	emails: string[];
};
export type OwnerResponse = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	userId: number;
	createdAt: string;
	updatedAt: string;
	archived: boolean;
};
export type DealStageResponse = {
	label: string;
	displayOrder: number;
	id: string;
	createdAt: string;
	updatedAt: string;
	archived: boolean;
};
export type PropertyResponse = {
	updatedAt: string;
	createdAt: string;
	name: string;
	label: string;
	type: string;
	fieldType: string;
	description: string;
	groupName: string;
	options: Array<{
		label: string;
		value: string;
		displayOrder: number;
		hidden: boolean;
	}>;
	displayOrder: number;
	calculated: boolean;
	externalOptions: boolean;
	hasUniqueValue: boolean;
	hidden: boolean;
	hubspotDefined: boolean;
	modificationMetadata: {
		archivable: boolean;
		readOnlyDefinition: boolean;
		readOnlyOptions: boolean;
		readOnlyValue: boolean;
	};
	formField: boolean;
};
export type DealPipelineResponse = {
	label: string;
	displayOrder: number;
	id: string;
	stages: Array<DealStageResponse>;
	createdAt: string;
	updatedAt: string;
	archived: boolean;
};

export type ListDealPipelinesResponse = {
	results: Array<DealPipelineResponse>;
};
export type ListPipelineStagesResponse = {
	results: Array<DealStageResponse>;
};
export type ListOwnersResponse = {
	results: Array<OwnerResponse>;
};

export type ListPropertiesResponse = {
	results: Array<PropertyResponse>;
};

export type SearchDealsResponse = {
	total: number;
	results: Array<{
		id: string;
		createdAt: string;
		updatedAt: string;
		archived: boolean;
		properties: Record<string, any>;
	}>;
	paging?: {
		next: {
			link: string;
			after: string;
		};
	};
};
