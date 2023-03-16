import { createTrigger, getAccessTokenOrThrow, HttpResponse, httpClient, HttpMethod, AuthenticationType } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { googleContactsCommon } from '../common';

export const googleContactNewOrUpdatedContact = createTrigger({
    name: 'new_or_updated_contact',
    displayName: 'New Or Updated Contact',
    description: 'Triggers when there is a new or updated contact',
    props: {
        authentication: googleContactsCommon.authentication,
    },
    sampleData: {
        "resourceName": "people/c4278485694217203807",
        "etag": "%EiMBAgMFBgcICQoLDA0ODxATFBUWGSEiIyQlJicuNDU3PT4/QBoEAQIFByIMZFVwNlJPNEVKUzg9",
        "metadata": {
            "sources": [
                {
                    "type": "CONTACT",
                    "id": "3b603c120c68305f",
                    "etag": "#dUp6RO4EJS8=",
                    "updateTime": "2023-01-30T14:35:18.142565Z"
                }
            ],
            "objectType": "PERSON"
        },
        "names": [
            {
                "metadata": {
                    "primary": true,
                    "source": {
                        "type": "CONTACT",
                        "id": "3b603c120c68305f"
                    }
                },
                "displayName": "Shahed Mashni",
                "familyName": "Mashni",
                "givenName": "Shahed",
                "displayNameLastFirst": "Mashni, Shahed",
                "unstructuredName": "Shahed Mashni"
            }
        ],
        "photos": [
            {
                "metadata": {
                    "primary": true,
                    "source": {
                        "type": "CONTACT",
                        "id": "3b603c120c68305f"
                    }
                },
                "url": "https://lh3.googleusercontent.com/cm/AAkddurmZojs4vCcxrpkfSxH9tnqcH-hI82ESDnwv6eq86nZeLStcjYEIe_TCx8r8g5Y=s100",
                "default": true
            }
        ],
        "memberships": [
            {
                "metadata": {
                    "source": {
                        "type": "CONTACT",
                        "id": "3b603c120c68305f"
                    }
                },
                "contactGroupMembership": {
                    "contactGroupId": "myContacts",
                    "contactGroupResourceName": "contactGroups/myContacts"
                }
            }
        ]
    },
    type: TriggerStrategy.POLLING,
    async onEnable(ctx) {
        const response = await listContacts(getAccessTokenOrThrow(ctx.propsValue['authentication']), undefined);
        await ctx.store?.put("syncToken", response.body.nextSyncToken);
    },
    async onDisable(ctx) {
        console.log("Disabling google contact trigger");
    },
    async run(ctx) {
        let newContacts: Connection[] = [];
        let fetchMore = true;
        while (fetchMore) {
            const syncToken: string = (await ctx.store?.get("syncToken"))!;
            const response = await listContacts(getAccessTokenOrThrow(ctx.propsValue['authentication']), syncToken);
            const newConnections = response.body.connections;
            await ctx.store?.put("syncToken", response.body.nextSyncToken);
            if (newConnections === undefined || newConnections.length == 0) {
                fetchMore = false;
            }
            if (newConnections !== undefined) {
                newContacts = [...newContacts, ...newConnections];
            }
        }
        console.log(`Found ${newContacts.length} new contacts`);
        return newContacts.filter(f => {
            return f.metadata.deleted !== true;
        });
    },
});

function listContacts(access_token: string, syncToken: string | undefined): Promise<HttpResponse<{ connections: Connection[], nextSyncToken: string }>> {
    let qParams: Record<string, string> = {
        personFields: "Addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined",
        requestSyncToken: "true"
    };
    if (syncToken !== undefined) {
        qParams = {
            ...qParams,
            syncToken: syncToken
        }
    }
    return httpClient.sendRequest<{ connections: Connection[], nextSyncToken: string }>({
        method: HttpMethod.GET,
        url: googleContactsCommon.baseUrl + "/me/connections",
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: access_token,
        },
        queryParams: qParams
    });
}

interface Connection {
    metadata: {
        deleted?: boolean;
    }
}
