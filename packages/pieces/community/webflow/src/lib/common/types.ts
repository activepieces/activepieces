export type WebflowAuthValue = { access_token: string };

export type WebflowSite = { _id: string; name: string };

export type WebflowCollection = { _id: string; name: string };

export type WebflowCollectionField = {
	slug: string;
	name: string;
	type: string;
	editable: boolean;
	required: boolean;
	validations: { options: { name: string }[] };
};

export type WebflowCollectionDetails = WebflowCollection & { fields: WebflowCollectionField[] };

export type WebflowCollectionItem = { _id: string; name: string; fields: Record<string, unknown> };

export type WebflowCollectionItemsPage = { items: WebflowCollectionItem[] };

export type WebflowOrder = { orderId: string };

export type WebflowWebhook = { _id: string };
