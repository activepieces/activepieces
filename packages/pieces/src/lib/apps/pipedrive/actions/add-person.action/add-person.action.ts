import { AuthenticationType } from "../../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../../common/http/core/http-client";
import { HttpMethod } from "../../../../common/http/core/http-method";
import { HttpRequest } from "../../../../common/http/core/http-request";
import { createAction } from "../../../../framework/action/action";
import { OAuth2PropertyValue, Property } from "../../../../framework/property";
import { pipedriveCommon } from "../../common";

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
                const users = (await getUsers(authProp)).users;
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
                const orgs = (await getOrganizations(authProp)).orgs;
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
        const configsWithoutAuthentication = { ...context.propsValue };
        delete configsWithoutAuthentication['authentication'];
        const body = configsWithoutAuthentication;

        const request: HttpRequest<any> = {
            method: HttpMethod.POST,
            url: `${context.propsValue.authentication!.data['api_domain']}/api/v1/persons`,
            body: body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.propsValue.authentication!.access_token,
            },
            queryParams: {},
        };

        const result = await httpClient.sendRequest(request);

        if (result.body?.['success']) {
            return result.body?.["data"];
        } else {
            return result;
        }
    },
    sampleData:
    {
      "id": 1,
      "company_id": 12,
      "owner_id": {
        "id": 123,
        "name": "Jane Doe",
        "email": "jane@pipedrive.com",
        "has_pic": 1,
        "pic_hash": "2611ace8ac6a3afe2f69ed56f9e08c6b",
        "active_flag": true,
        "value": 123
      },
      "org_id": {
        "name": "Org Name",
        "people_count": 1,
        "owner_id": 123,
        "address": "Mustamäe tee 3a, 10615 Tallinn",
        "active_flag": true,
        "cc_email": "org@pipedrivemail.com",
        "value": 1234
      },
      "name": "Will Smith",
      "first_name": "Will",
      "last_name": "Smith",
      "open_deals_count": 2,
      "related_open_deals_count": 2,
      "closed_deals_count": 3,
      "related_closed_deals_count": 3,
      "participant_open_deals_count": 1,
      "participant_closed_deals_count": 1,
      "email_messages_count": 1,
      "activities_count": 1,
      "done_activities_count": 1,
      "undone_activities_count": 2,
      "files_count": 2,
      "notes_count": 2,
      "followers_count": 3,
      "won_deals_count": 3,
      "related_won_deals_count": 3,
      "lost_deals_count": 1,
      "related_lost_deals_count": 1,
      "active_flag": true,
      "phone": [
        {
          "value": "12345",
          "primary": true,
          "label": "work"
        }
      ],
      "email": [
        {
          "value": "12345@email.com",
          "primary": true,
          "label": "work"
        }
      ],
      "primary_email": "12345@email.com",
      "first_char": "w",
      "update_time": "2020-05-08 05:30:20",
      "add_time": "2017-10-18 13:23:07",
      "visible_to": "3",
      "marketing_status": "no_consent",
      "picture_id": {
        "item_type": "person",
        "item_id": 25,
        "active_flag": true,
        "add_time": "2020-09-08 08:17:52",
        "update_time": "0000-00-00 00:00:00",
        "added_by_user_id": 967055,
        "pictures": {
          "128": "https://pipedrive-profile-pics.s3.example.com/f8893852574273f2747bf6ef09d11cfb4ac8f269_128.jpg",
          "512": "https://pipedrive-profile-pics.s3.example.com/f8893852574273f2747bf6ef09d11cfb4ac8f269_512.jpg"
        },
        "value": 4
      },
      "next_activity_date": "2019-11-29",
      "next_activity_time": "11:30:00",
      "next_activity_id": 128,
      "last_activity_id": 34,
      "last_activity_date": "2019-11-28",
      "last_incoming_mail_time": "2019-05-29 18:21:42",
      "last_outgoing_mail_time": "2019-05-30 03:45:35",
      "label": 1,
      "org_name": "Organization name",
      "owner_name": "Jane Doe",
      "cc_email": "org@pipedrivemail.com"
    }
});
async function getUsers(authProp: OAuth2PropertyValue): Promise<{ users: PipedriveUser[] }> {
    const request: HttpRequest<any> = {
        method: HttpMethod.GET,
        url: `${authProp.data['api_domain']}/api/v1/users`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
        },
        queryParams: {},
    };

    const result = await httpClient.sendRequest(request);

    return {
        users: result.body['success'] && result.body['data'] != null ? result.body['data'] : <PipedriveUser[]>[]
    };
}

async function getOrganizations(authProp: OAuth2PropertyValue): Promise<{ orgs: PipedriveOrganization[] }> {
    const request: HttpRequest<any> = {
        method: HttpMethod.GET,
        url: `${authProp.data['api_domain']}/api/v1/organizations`,
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
        orgs: result.body['success'] && result.body['data'] != null ? result.body['data'] : <PipedriveOrganization[]>[]
    };
}

interface PipedriveUser {
    id: string;
    name: string;
}

interface PipedriveOrganization {
    id: string;
    name: string;
}