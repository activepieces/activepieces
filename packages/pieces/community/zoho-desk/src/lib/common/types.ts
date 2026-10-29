export type ZohoDeskAuthValue = { access_token: string; props?: { location?: string } };

export type ZohoDeskPage<T> = { data: T[] };

export type ZohoDeskOrganization = { id: string; companyName: string };

export type ZohoDeskDepartment = { id: string; name: string };

export type ZohoDeskContact = { id: string; email?: string; firstName?: string; lastName?: string };

export type ZohoDeskTicket = {
	id: string;
	ticketNumber?: string;
	subject?: string;
	status?: string;
};

export type ZohoDeskRecord = Record<string, unknown>;

export type ZohoDeskFile = { filename: string; data: Buffer };

export type ZohoDeskDownload = { data: Buffer; fileName: string | undefined };
export type ZohoDeskThread = {
	id: string;
	isContentTruncated?: boolean;
	content?: string;
	[key: string]: unknown;
};

