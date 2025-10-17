import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

import { insertRow } from "./lib/actions/insert-row";
import { insertRows } from "./lib/actions/insert-rows";
import { findRow } from "./lib/actions/find-row";
import { deleteRow } from "./lib/actions/delete-row";
import { runCustomSql } from "./lib/actions/run-custom-sql";
import { updateRow } from "./lib/actions/update-row";
import { newRow } from "./lib/triggers/new-row";

export const oracleAuth = PieceAuth.CustomAuth({
    description: `
    Connect to your Oracle Database using Basic Authentication.
    You will need:
    1.  **Connection String**: The base REST endpoint URL for your database (e.g., \`https://your-domain.com/ords/your_db\`).
    2.  **Username and Password**: Your database user credentials.
    3.  **Identity Domain ID**: Required for certain Oracle Cloud environments.
    `,
    required: true,
    props: {
        connectString: Property.LongText({
            displayName: 'Connection String (REST Endpoint)',
            description: 'The base URL for the Oracle Database REST API.',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'The username for your Oracle Database.',
            required: true,
        }),
        password: PieceAuth.SecretText({
            displayName: 'Password',
            description: 'The password for your Oracle Database.',
            required: true,
        }),
        identityDomain: Property.ShortText({
            displayName: 'Identity Domain ID (Optional)',
            description: 'Your Identity Domain ID, used in the "X-ID-TENANT-NAME" header.',
            required: false,
        })
    },
    validate: async ({ auth }) => {
        try {
            const testUrl = `${auth.connectString.replace(/\/$/, "")}/_/db-api/stable/environment/databases/`;

            const headers: Record<string, string> = {
                'Authorization': 'Basic ' + Buffer.from(`${auth.username}:${auth.password}`).toString('base64'),
            };

            if (auth.identityDomain) {
                headers['X-ID-TENANT-NAME'] = auth.identityDomain as string;
            }

            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: testUrl,
                headers: headers,
            });

            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Connection failed. Please check your Connection String, Username, and Password.',
            };
        }
    },
});


export const oracleDatabase = createPiece({
    displayName: "Oracle Database",
    description: "Manage and interact with Oracle databases, perform CRUD operations, and run custom SQL queries.",
    categories: [PieceCategory.CONTENT_AND_FILES],
    auth: oracleAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/oracle-database.png",
    authors: [
        "Pranith124"
    ],
    actions: [
      insertRow,
      insertRows,
      findRow,
      deleteRow,
      runCustomSql,
      updateRow
    ],
    triggers: [
      newRow
    ],
});