export type IssueTypeMetadata = {
    id:string,
    name:string
}

export type IssueFieldMetaData ={
    required:boolean,
    name:string,
    key:string,
    fieldId:string,
    schema:{
        type:"string"|"date"|"datetime"|"array"|"number"|"option"|"user"|"group"|"version"|"project"|"issuelink"|"priority"|"issuetype"|"component", // "option-with-child",
        items:string,
        custom?:string,
        customId?:number,
    },
    allowedValues?:Array<{value:string,id:string,name:string}>
}

export type JiraSearchResponse = {
	issues: any[];
    nextPageToken?: string;
	names?: Record<string, string>;
};

export const VALID_CUSTOM_FIELD_TYPES = [
	'userpicker',
	'participants',
	'multiuserpicker',
	'multiversion',
	'version',
	'multigrouppicker',
	'grouppicker',
	'multicheckboxes',
	'multiselect',
	'datepicker',
	'datetime',
	'labels',
	'float',
	'textarea',
	'radiobuttons',
	'select',
	'textfield',
	'url',
	'project',
	'people',
];

export type ChangelogItem = {
	field: string;
	fieldId?: string;
	from: string | null;
	fromString: string | null;
	to: string | null;
	toString: string | null;
};

export type ChangelogHistory = {
	id: string;
	author?: { accountId: string; displayName: string; emailAddress?: string };
	created: string;
	items: ChangelogItem[];
};
