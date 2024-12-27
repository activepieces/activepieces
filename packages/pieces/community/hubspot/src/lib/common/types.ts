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
export type HubspotProperty= {
	name: string;
	label: string;
	description: string;
	hidden?:boolean;
	type: string;
	groupName:string;
	fieldType: string;
	referencedObjectType?:string;
	modificationMetadata?:{
		archivable: boolean;
		readOnlyDefinition: boolean;
		readOnlyValue: boolean;
	}
	options: Array<{label:string,value:string}>;
	
}

export type HubspotPropertyGroup = {
	name: string;
	label: string;
	displayOrder: number;
	archived: boolean;
};

export type WorkflowResponse = 
{
	id:number;
	insertAt:number;
	updatedAt:number;
	name:string;
	enabled:boolean
}

export enum FilterOperatorEnum {
    Eq = "EQ",
    Neq = "NEQ",
    Lt = "LT",
    Lte = "LTE",
    Gt = "GT",
    Gte = "GTE",
    Between = "BETWEEN",
    In = "IN",
    NotIn = "NOT_IN",
    HasProperty = "HAS_PROPERTY",
    NotHasProperty = "NOT_HAS_PROPERTY",
    ContainsToken = "CONTAINS_TOKEN",
    NotContainsToken = "NOT_CONTAINS_TOKEN",
}

export enum HubspotFieldType {
	BooleanCheckBox = 'booleancheckbox',
	Date = 'date',
	File = 'file',
	Number = 'number',
	CalculationEquation = 'calculation_equation',
	PhoneNumber = 'phonenumber',
	Text = 'text',
	TextArea = 'textarea',
	Html = 'html',
	CheckBox = 'checkbox',
	Select = 'select',
	Radio = 'radio',
}

export declare enum AssociationSpecAssociationCategoryEnum {
    HubspotDefined = "HUBSPOT_DEFINED",
    UserDefined = "USER_DEFINED",
    IntegratorDefined = "INTEGRATOR_DEFINED"
}

export type ListBlogsResponse = {
	objects:Array<{absolute_url:string,id:number}>;
	offset:number,
	total:number,
	limit:number
}