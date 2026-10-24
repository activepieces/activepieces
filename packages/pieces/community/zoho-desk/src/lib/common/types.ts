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

export type ZohoDeskActivity = {
	contactId?: string;
	subject?: string;
	departmentId?: string;
	startTime?: string;
	status?: string;
};

export type ZohoDeskTimeEntry = {
	executedTime?: string;
	hoursSpent?: number;
	minutesSpent?: number;
	secondsSpent?: number;
	description?: string;
	ownerId?: string;
	isBillable?: boolean;
	requestChargeType?: string;
	additionalCost?: number;
	cf?: Record<string, unknown>;
};
