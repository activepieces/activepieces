export type HubSpotAddContactsToListResponse = {
	updated: number[];
	discarded: number[];
	invalidVids: number[];
	invalidEmails: string[];
};

export type HubspotProperty = {
	name: string;
	label: string;
	description: string;
	hidden?: boolean;
	type: string;
	groupName: string;
	fieldType: string;
	referencedObjectType?: string;
	modificationMetadata?: {
		archivable: boolean;
		readOnlyDefinition: boolean;
		readOnlyValue: boolean;
	};
	options: Array<{ label: string; value: string }>;
};

export type WorkflowResponse = {
	id: number;
	insertAt: number;
	updatedAt: number;
	name: string;
	enabled: boolean;
};

export enum FilterOperatorEnum {
	Eq = 'EQ',
	Neq = 'NEQ',
	Lt = 'LT',
	Lte = 'LTE',
	Gt = 'GT',
	Gte = 'GTE',
	Between = 'BETWEEN',
	In = 'IN',
	NotIn = 'NOT_IN',
	HasProperty = 'HAS_PROPERTY',
	NotHasProperty = 'NOT_HAS_PROPERTY',
	ContainsToken = 'CONTAINS_TOKEN',
	NotContainsToken = 'NOT_CONTAINS_TOKEN',
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
	HubspotDefined = 'HUBSPOT_DEFINED',
	UserDefined = 'USER_DEFINED',
	IntegratorDefined = 'INTEGRATOR_DEFINED',
}

export type ListBlogsResponse = {
	objects: Array<{ absolute_url: string; id: number }>;
	offset: number;
	total: number;
	limit: number;
};
