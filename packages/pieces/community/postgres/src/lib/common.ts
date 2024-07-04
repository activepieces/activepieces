import { PiecePropValueSchema } from "@activepieces/pieces-framework";
import { postgresAuth } from "..";
import { Client } from "pg";

export const pgClient = async (auth: PiecePropValueSchema<typeof postgresAuth>, query_timeout = 30000, application_name: string | undefined = undefined , connectionTimeoutMillis = 30000) => {
    const {
        host,
        user,
        database,
        password,
        port,
        enable_ssl,
        reject_unauthorized: rejectUnauthorized,
        certificate,
    } = auth;

    const sslConf = {
        rejectUnauthorized: rejectUnauthorized,
        ca: certificate && certificate.length > 0 ? certificate : undefined,
    };
    const client = new Client({
        host,
        port: Number(port),
        user,
        password,
        database,
        ssl: enable_ssl ? sslConf : undefined,
        query_timeout: Number(query_timeout),
        statement_timeout: Number(query_timeout),
        application_name,
        connectionTimeoutMillis: Number(connectionTimeoutMillis),
    });
    await client.connect();

    return client;
}
