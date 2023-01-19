import { resourceLimits } from "worker_threads";
import { brotliDecompressSync } from "zlib";
import {AuthenticationType} from "../../../../common/authentication/core/authentication-type";
import {httpClient} from "../../../../common/http/core/http-client";
import {HttpMethod} from "../../../../common/http/core/http-method";
import {HttpRequest} from "../../../../common/http/core/http-request";
import { HttpResponse } from "../../../../common/http/core/http-response";
import {createAction} from "../../../../framework/action/action";
import {OAuth2PropertyValue, Property} from "../../../../framework/property";
import {pipedriveCommon} from "../../common";

export const addPerson = createAction({
    name: 'add_person',
    displayName: "Add Person",
    description: "Add a new person to the account",
    props: {
        authentication: pipedriveCommon.authentication,
        name: Property.ShortText({
            displayName: 'Name',
            description: undefined,
            required: true,
        }),
        owner_id: Property.Dropdown<string>({
            displayName: "Owner",
            refreshers: ["authentication"],
            description: "The user who owns this Person's record",
            required: false,
            options: async (propsValue) => {
                if (propsValue['authentication'] === undefined) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Connect your account"
                    }
                }
                const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
                let users =  (await getUsers(authProp)).users;
                return {
                    disabled: false,
                    options: users.map(u => {
                        return {
                            label: u.name,
                            value: u.id
                        }
                    })
                };
            }
        }),
        org_id: Property.Dropdown<string>({
            displayName: "Organization",
            refreshers: ["authentication"],
            description: "The Org of this Person",
            required: false,
            options: async (propsValue) => {
                if (propsValue['authentication'] === undefined) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Connect your account"
                    }
                }
                const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
                let orgs =  (await getOrganizations(authProp)).orgs;
                return {
                    disabled: false,
                    options: orgs.map(o => {
                        return {
                            label: o.name,
                            value: o.id
                        }
                    })
                };
            }
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: undefined,
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: undefined,
            required: false,
        }),
        marketing_status: Property.Dropdown<string>({
            displayName: "Marketing Status",
            refreshers: ["authentication"],
            description: "Marketing opt-in status",
            required: false,
            options: async (propsValue) => {                                
                return {
                    disabled: false,
                    options: [
                        {
                            label: "No Consent",
                            value: "no_consent"
                        },
                        {
                            label: "Unsubscribed",
                            value: "unsubscribed"
                        },
                        {
                            label: "Subscribed",
                            value: "subscribed"
                        },
                        {
                            label: "Archived",
                            value: "archived"
                        }
                    ]
                };
            }
        }),
    },
    async run(context) {
        const configsWithoutAuthentication = {...context.propsValue};
        delete configsWithoutAuthentication['authentication'];
        const body = configsWithoutAuthentication;

        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${context.propsValue.authentication!.data.api_domain}/api/v1/persons`,
            body: body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue.authentication!.access_token,
            },
            queryParams: {},
        };

        const result = await httpClient.sendRequest(request);
        
        if (result.body?.success) {
            return result.body?.data;
        } else {
            return result;
        }
    },
});
async function getUsers(authProp: OAuth2PropertyValue): Promise<{users:PipedriveUser[]}> {
    const request: HttpRequest<any> = {
        method: HttpMethod.GET,
        url: `${authProp.data.api_domain}/api/v1/users`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
        },
        queryParams: {},
    };

    const result = await httpClient.sendRequest(request);

    return {
        users: result.body.success && result.body.data != null ? result.body.data : <PipedriveUser[]>[]
    };
}

async function getOrganizations(authProp: OAuth2PropertyValue): Promise<{orgs:PipedriveOrganization[]}> {
    const request: HttpRequest<any> = {
        method: HttpMethod.GET,
        url: `${authProp.data.api_domain}/api/v1/organizations`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
        },
        queryParams: {
            limit: "500" // max limit is 500 (API restriction)
        },
    };

    const result = await httpClient.sendRequest(request);

    return {
        orgs: result.body.success && result.body.data != null ? result.body.data : <PipedriveOrganization[]>[]
    };
}

interface PipedriveUser
{
    id:string;
    name:string;
}

interface PipedriveOrganization
{
    id:string;
    name:string;
}