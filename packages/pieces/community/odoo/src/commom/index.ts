import { Client, createClient, createSecureClient } from "xmlrpc";

import {
    AbstractExecuteParams,
    ExecuteKwParams,
    GetAllCompaniesParams,
    GetAllContactsParams,
    GetCompanyParams,
    GetContactParams,
    OdooConfig,
    RenderReportParams,
    SaveCompanyParams,
    SaveContactParams,
} from "./type";

class Odoo {
    config: OdooConfig;
    host: string;
    port: number;
    db: string;
    username: string;
    password: string;
    secure: boolean;
    uid: number;

    constructor(config: OdooConfig) {
        this.config = config;

        const { hostname, port, protocol } = new URL(config.url);

        this.host = hostname;
        this.port = config.port || Number(port);
        this.db = config.db;
        this.username = config.username;
        this.password = config.password;
        this.secure = true;

        if (protocol !== "https:") {
            this.secure = false;
        }
        this.uid = 0;
    }

    private getClient(path: string): Client {
        const createClientFn = this.secure ? createSecureClient : createClient;

        return createClientFn({
            host: this.host,
            port: this.port,
            path,
        });
    }

    private methodCall(client: Client, method: string, params: any[] = []) {
        return new Promise((resolve, reject) => {
            client.methodCall(method, params, (err, value) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }

                if (value.length == 1)
                    return resolve(value[0])
                else if (value.length > 0)
                    return resolve(value);
                else if (['read', 'search', 'search_read'].includes(params[4]))
                    return reject("Not found")
                else
                    return resolve(value);
            });
        });
    }

    connect(): Promise<number> {
        const client = this.getClient("/xmlrpc/2/common");

        return new Promise((resolve, reject) => {
            client.methodCall(
                "authenticate",
                [this.db, this.username, this.password, {}],
                (error, value) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!value) {
                        return reject(new Error("No UID returned from authentication."));
                    }

                    this.uid = value;

                    return resolve(this.uid);
                }
            );
        });
    }

    async execute<T = any>({ client, endpoint, params }: AbstractExecuteParams) {
        try {
            const value = await this.methodCall(client, endpoint, [
                this.db,
                this.uid,
                this.password,
                ...params,
            ]);

            return Promise.resolve(value as T);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async execute_kw<T = any>({
        model,
        method,
        params,
    }: ExecuteKwParams): Promise<T> {
        const client = this.getClient("/xmlrpc/2/object");

        return this.execute<T>({
            client,
            endpoint: "execute_kw",
            params: [model, method, ...params],
        });
    }

    async exec_workflow<T = any>({
        model,
        method,
        params,
    }: ExecuteKwParams): Promise<T> {
        const client = this.getClient("/xmlrpc/2/object");

        return this.execute<T>({
            client,
            endpoint: "exec_workflow",
            params: [model, method, ...params],
        });
    }

    async render_report<T = any>({
        report,
        params,
    }: RenderReportParams): Promise<T> {
        const client = this.getClient("/xmlrpc/2/report");

        return this.execute<T>({
            client,
            endpoint: "render_report",
            params: [report, ...params],
        });
    }

    async getAllContacts<T = any>({
        fields = ['name', 'phone', 'email', 'company_name', 'function'],
        isCompany = false
    }: GetAllContactsParams): Promise<T> {
        return this.execute_kw<T>({
            model: "res.partner",
            method: "search_read",
            params: [
                [[["is_company", "=", isCompany]],
                    fields]
            ]
        })
    }

    async getAllCompanies<T = any>({
        fields = ['name', 'phone', 'email', 'country_id'],
    }: GetAllCompaniesParams): Promise<T> {
        return this.getAllContacts<T>({
            fields: fields,
            isCompany: true
        })
    }

    async getContact<T = any>({
        name,
        fields = ['name', 'phone', 'email', 'company_name', 'function'],
        isCompany = false
    }: GetContactParams): Promise<T> {
        return this.execute_kw<T>({
            model: "res.partner",
            method: "search_read",
            params: [
                [[["is_company", "=", isCompany], ["name", "like", name]],
                    fields]
            ]
        })
    }

    async getCompany<T = any>({
        name,
        fields = ['name', 'phone', 'email', 'country_id'],
    }: GetCompanyParams): Promise<T> {
        return this.getContact<T>({
            name: name,
            fields: fields,
            isCompany: true
        })
    }

    async saveContact<T = any>({
        name,
        phone,
        email,
        company,
        title,
        company_id,
        address,
    }: SaveContactParams): Promise<T> {

        const contact = {
            name: name,
            phone: phone,
            email: email,
            company_name: company,
            company_id: company_id || null,
            function: title,
        };

        try {
            const record = await this.execute_kw<T>({
                model: "res.partner",
                method: "search",
                params: [
                    [[["is_company", "=", false], ["name", "=", name]]]
                ]
            })

            this.execute_kw<T>({
                model: "res.partner",
                method: "write",
                params: [[record, contact]],
            });

            return Promise.resolve(record as T)
        } catch (err) {
            if (err === "Not found") {
                return this.execute_kw({
                    model: "res.partner",
                    method: "create",
                    params: [[[contact]]],
                });
            } else
                return Promise.reject("Error")

        }
    }

    async saveCompany<T = any>({
        name,
        phone,
        email,
        address,
    }: SaveCompanyParams): Promise<T> {

        const contact = {
            name: name,
            phone: phone,
            email: email,
            is_company: true
        };

        try {
            const record = await this.execute_kw<T>({
                model: "res.partner",
                method: "search",
                params: [
                    [[["is_company", "=", true], ["name", "=", name]]]
                ]
            })

            this.execute_kw<T>({
                model: "res.partner",
                method: "write",
                params: [[record, contact]],
            });

            return Promise.resolve(record as T)
        } catch (err) {
            if (err === "Not found") {
                return this.execute_kw({
                    model: "res.partner",
                    method: "create",
                    params: [[[contact]]],
                });
            } else
                return Promise.reject("Error")

        }
    }

}

export default Odoo;