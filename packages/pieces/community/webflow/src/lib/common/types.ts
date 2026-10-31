export type WebflowAuthValue = { access_token: string };

export type WebflowSite = { id: string; displayName: string };

export type WebflowCollection = { id: string; displayName: string };

export type WebflowCollectionField = {
	id: string;
	slug: string;
	displayName: string;
	type: string;
	isEditable: boolean;
	isRequired: boolean;
	validations?: { options?: { id: string; name: string }[] } | null;
};

export type WebflowCollectionDetails = WebflowCollection & { fields: WebflowCollectionField[] };

export type WebflowCollectionItem = {
	id: string;
	fieldData: Record<string, unknown> & { name?: string };
};

export type WebflowPagination = { limit: number; offset: number; total: number };

export type WebflowCollectionItemsPage = {
	items: WebflowCollectionItem[];
	pagination: WebflowPagination;
};

export type WebflowOrder = { orderId: string };

export type WebflowOrdersPage = { orders: WebflowOrder[]; pagination: WebflowPagination };

export type WebflowWebhook = { id: string };
