import { Client } from "xmlrpc";

export type OdooConfig = {
    url: string;
    port?: number;
    db: string;
    username: string;
    password: string;
    secure?: boolean;
};

export type ExecuteKwParams = {
    model: string;
    method: string;
    params: any[];
};

export type AbstractExecuteParams = {
    endpoint: string;
    client: Client;
    params: any[];
};

export type RenderReportParams = {
    report: string;
    params: any[];
};

export type GetAllContactsParams = {
    fields?: any[];
    isCompany?: boolean;
};

export type GetAllCompaniesParams = {
    fields?: any[];
};


export type GetContactParams = {
    name: string;
    fields?: any[];
    isCompany?: boolean;
};

export type GetCompanyParams = {
    name: string;
    fields?: any[];
};

export type SaveContactParams = {
    name: string;
    phone: string;
    email: string;
    company: string;
    company_id?: number;
    title: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    },
};

export type SaveCompanyParams = {
    name: string;
    phone: string;
    email: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    },
};