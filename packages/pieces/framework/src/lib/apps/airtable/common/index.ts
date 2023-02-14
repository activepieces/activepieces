import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { Property } from "../../../framework/property"

declare type AirtablePermissionLevel = "none" | "read" | "comment" | "edit" | "create";
interface AirtableBase {
    id: string;
    name: string;
    permissionLevel: AirtablePermissionLevel
}

export interface AirtableRecord {
    fields: Record<string, unknown>,
    createdTime: Date,
    id: string;
}
export interface AirtableWebhookInformation {
    id: string;
    macSecretBase64: string;
}
export const airtableCommon = {
    baseUrl: (accountId: string) => { return `https://api.getdrip.com/v2/${accountId}` },
    authentication: Property.SecretText({
        displayName: "Personal Token",
        required: true,
        description: "Visit https://airtable.com/create/tokens/ to create one"
    }),
    base: Property.Dropdown({
        displayName: 'Base',
        required: true,
        refreshers: ["authentication"],
        options: async (props) => {
            if (!props['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please connect your account"
                }
            }
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: "https://api.airtable.com/v0/meta/bases",
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: props["authentication"]! as string
                }
            };
            const response = await httpClient.sendRequest<{ bases: AirtableBase[] }>(request);
            const opts = response.body.bases.map((base) => {
                return { value: base.id, label: base.name };
            });
            return {
                disabled: false,
                options: opts,
            }
        }

    }),
    table: Property.Dropdown({
        displayName: 'Table',
        required: true,
        refreshers: ["authentication", "base"],
        options: async (props) => {
            if (!props['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please connect your account"
                }
            }
            if (!props['base']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please select a base first"
                }
            }

            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: `https://api.airtable.com/v0/meta/bases/${props['base']}/tables`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: props["authentication"]! as string
                }
            };
            const response = await httpClient.sendRequest<{ tables: { id: string, name: string }[] }>(request);
            const opts = response.body.tables.map((table) => {
                return { value: table.id, label: table.name };
            });
            return {
                disabled: false,
                options: opts,
            }
        }

    }),
    async getRecord(params: { recordId: string, accessToken: string, baseId: string, tableId: string }): Promise<AirtableRecord | null> {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.airtable.com/v0/bases/${params.baseId}/${params.tableId}/${params.recordId}}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: params.accessToken
            }
        };
        const { body } = await httpClient.sendRequest<AirtableRecord>(request);
        return body;

    },
    async getWebhookPayload(params: { webhookId: string, baseId: string, personalToken: string, cursor: number | undefined }) {

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: ` https://api.airtable.com/v0/bases/${params.baseId}/webhooks/${params.webhookId}/payloads`,
            authentication:
            {
                type: AuthenticationType.BEARER_TOKEN,
                token: params.personalToken
            },
            queryParams: params.cursor ? { cursor: params.cursor.toString() } : undefined
        };
        const { body } = await httpClient.sendRequest<{ payloads: unknown[], cursor: number | undefined }>(request);
        return body;
    }

}

