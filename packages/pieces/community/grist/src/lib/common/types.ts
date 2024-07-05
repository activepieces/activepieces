export type GristOrganizationResponse = {
	name: string;
	id: string;
	createdAt: string;
	updatedAt: string;
};

export type GristDocumentResponse = {
	name: string;
	id: string;
	createdAt: string;
	updatedAt: string;
};

export type GristWorkspaceResponse = {
	name: string;
	id: number;
	createdAt: string;
	updatedAt: string;
	docs: Array<GristDocumentResponse>;
};

export type GristTableResponse = {
	id: string;
};

export type GristTableColumnsResponse = {
	id: string;
	fields: {
		type:
			| 'Any'
			| 'Text'
			| 'Numerics'
			| 'Int'
			| 'Bool'
			| 'Date'
			| `DateTime:${string}`
			| `Ref:${string}`
			| `RefList:${string}`
			| 'Choice'
			| 'ChoiceList'
			| 'Attachments';
		label: string;
		widgetOptions: string;
	};
};
