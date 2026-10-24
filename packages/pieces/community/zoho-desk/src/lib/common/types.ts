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
