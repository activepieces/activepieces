import { BasicAuthConnectionValue, TriggerStrategy } from "@activepieces/shared";
import { AuthenticationType, BasicAuthPropertyValue, createTrigger, DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper, Property } from "@activepieces/framework";


export const newTicketInView = createTrigger({
    name: 'new_ticket_in_view',
    displayName: 'New ticket in view',
    description: 'Triggers when a new ticket is created in a view',
    type: TriggerStrategy.POLLING,
    props: {
        authentication: Property.BasicAuth({
            displayName: 'Authentication',
            username: {
                displayName: 'Email Address',
                description: 'The email address you use to login to Zendesk',
            },
            password: {
                displayName: 'Token',
                description: 'The API token you can generate in Zendesk',
            },
            required: true,
        }),
        // TODO move this to a connection
        subdomain: Property.ShortText({
            displayName: 'Subdomain',
            description: 'The subdomain of your Zendesk instance',
            required: true,
        }),
        view_id: Property.Dropdown({
            displayName: 'View',
            description: 'The view to monitor for new tickets',
            refreshers: ['subdomain', 'authentication'],
            required: true,
            options: async (value) => {
                if (!value['subdomain'] || !value['authentication']) {
                    return {
                        placeholder: 'Fill your subdomain and authentication first',
                        disabled: true,
                        options: [],
                    }
                }
                const { subdomain, authentication } = value;
                const { username, password } = authentication as BasicAuthConnectionValue;
                const response = await httpClient.sendRequest<{ views: any[] }>({
                    url: `https://${subdomain}.zendesk.com/api/v2/views.json`,
                    method: HttpMethod.GET,
                    authentication: {
                        type: AuthenticationType.BASIC,
                        username: username + "/token",
                        password,
                    }
                })
                return {
                    placeholder: 'Select a view',
                    options: response.body.views.map((view: any) => ({
                        label: view.title,
                        value: view.id,
                    }))
                }
            }
        })

    },
    sampleData: {
        "url": "https://activepieceshelp.zendesk.com/api/v2/tickets/5.json",
        "id": 5,
        "external_id": null,
        "via": {
            "channel": "web",
            "source": {
                "from": {},
                "to": {},
                "rel": null
            }
        },
        "created_at": "2023-03-25T02:39:41Z",
        "updated_at": "2023-03-25T02:39:41Z",
        "type": null,
        "subject": "Subject",
        "raw_subject": "Raw Subject",
        "description": "Description",
        "priority": null,
        "status": "open",
        "recipient": null,
        "requester_id": 8193592318236,
        "submitter_id": 8193592318236,
        "assignee_id": 8193592318236,
        "organization_id": 8193599387420,
        "group_id": 8193569448092,
        "collaborator_ids": [],
        "follower_ids": [],
        "email_cc_ids": [],
        "forum_topic_id": null,
        "problem_id": null,
        "has_incidents": false,
        "is_public": true,
        "due_at": null,
        "tags": [],
        "custom_fields": [],
        "satisfaction_rating": null,
        "sharing_agreement_ids": [],
        "custom_status_id": 8193592472348,
        "fields": [],
        "followup_ids": [],
        "ticket_form_id": 8193569410076,
        "brand_id": 8193583542300,
        "allow_channelback": false,
        "allow_attachments": true,
        "from_messaging_channel": false
    },
    onEnable: async (context) => {
        context.setSchedule({
            cronExpression: "*/1 * * * *"
        });
        await pollingHelper.onEnable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.poll(polling, {
            store: context.store,
            propsValue: context.propsValue,
        });
    }
});

const polling: Polling<{ subdomain: string, authentication: BasicAuthPropertyValue, view_id: string }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ propsValue }) => {
        const items = await getTickets(propsValue.subdomain, propsValue.authentication, propsValue.view_id);
        return items.map((item) => ({
            id: item.id,
            data: item,
        }));
    }
}

async function getTickets(subdomain: string, authentication: BasicAuthPropertyValue, view_id: string) {
    const { username, password } = authentication;
    const response = await httpClient.sendRequest<{ tickets: any[] }>({
        url: `https://${subdomain}.zendesk.com/api/v2/views/${view_id}/tickets.json?sort_order=desc&sort_by=created_at&per_page=200`,
        method: HttpMethod.GET,
        authentication: {
            type: AuthenticationType.BASIC,
            username: username + "/token",
            password,
        }
    })
    return response.body.tickets;
}