import { createTrigger, TriggerStrategy, Property, httpClient, AuthenticationType, HttpRequest, HttpMethod } from '@activepieces/framework';
import dayjs from 'dayjs';

export const gmailNewEmailTrigger = createTrigger({
    name: 'new_email_received',
    displayName: 'New Email',
    description: 'Triggers when new mail is found in your Gmail inbox',
    props: {
        authentication: Property.OAuth2({
            description: "",
            displayName: 'Authentication',
            authUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            required: true,
            scope: ["https://mail.google.com/"]
        }),
        from: Property.ShortText({
            displayName: 'Email sender',
            description: "The address sending the new mail",
            required: false,
            defaultValue: ""
        }),
        to: Property.ShortText({
            displayName: 'Email receipient',
            description: "The address receiving the new mail",
            required: false,
            defaultValue: ""
        }),
        subject: Property.ShortText({
            displayName: 'Email subject',
            description: "The email subject",
            required: false,
            defaultValue: ""
        }),
        category: Property.StaticDropdown({
            displayName: "Category",
            description: "category of the mail",
            required: false,
            options: {
                disabled: false,
                options: [
                    {label: 'Primary', value: 'primary'},
                    {label: 'Social', value: 'social'},
                    {label: 'Promotions', value: 'promotions'},
                    {label: 'Updates', value: 'updates'},
                    {label: 'Forums', value: 'forums'},
                    {label: 'Reservations', value: 'reservations'},
                    {label: 'Purchases', value: 'purchases'}
                ]
            }
        }),
        labels: Property.Dropdown<Label>({
            displayName: "Email receipient",
            description: "The address receiving the new mail",
            required: false,
            defaultValue: "",
            refreshers: ["authentication"],
            options: async ({ authentication }) => {
                if (authentication === undefined) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "please authenticate first"
                    }
                }

                const response = await httpClient.sendRequest<{ labels: Label[] }>({
                    method: HttpMethod.GET,
                    url: `https://gmail.googleapis.com/gmail/v1/users/me/labels`,
                    authentication: {
                        type: AuthenticationType.BEARER_TOKEN,
                        token: (authentication as string)
                    }
                })

                return {
                    disabled: false,
                    options: response.body.labels.map((label) => (
                        { 
                            "label": label.name,
                            "value": label
                        }
                    ))
                }
            }
        }),
        unread: Property.Checkbox({
            displayName: 'Is unread?',
            description: "Check if the email is unread or not",
            required: false,
            defaultValue: false
        })
    },
    sampleData: {
        "messages": [
            {
                "id": "150c7d689ef7cdf7",
                "threadId": "150c7d689ef7cdf7"
            }
        ],
        "resultSizeEstimate": 1
    },
    type: TriggerStrategy.POLLING,
    async onEnable({ store, propsValue: { authentication } }) {
        const last_read = dayjs().unix()

        await store?.put<TriggerData>('gmail_new_email_trigger', {
            last_read
        });
    },
    async onDisable({ store }) {
        await store.put('gmail_new_email_trigger', null);
    },
    async run({ store, propsValue: { authentication, from, to, subject, labels, category } }) {
        const data = await store?.get<{ last_read: number }>('gmail_new_email_trigger');
        if (data?.last_read != null) {
            data
        }
        
        const queryParams = []
        
        if (from) queryParams.push(`from:(${from})`)
        if (to) queryParams.push(`to:(${from})`)
        if (subject) queryParams.push(`subject:(${subject})`)
        if (labels) queryParams.push(`label:${labels.name}`)
        if (category) queryParams.push(`label:${category}`)
        
        const response = await httpClient.sendRequest<{ labels: Label[] }>({
            method: HttpMethod.GET,
            url: `https://gmail.googleapis.com/gmail/v1/users/me/labels`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: authentication.access_token
            },
            queryParams: {
                q: queryParams.join(" ")
            }
        })

        return [
            response.body
        ]
    },
});


interface TriggerData {
    last_read: number
}

enum MessageListVisibility {
    SHOW = "show",
    HIDE = "hide"
}

enum LabelListVisibility {
    SHOW = "show",
    HIDE = "hide"
}

enum LabelType {
    system = "system",
    user = "user"
}

interface Label {
    id: string,
    name: string,
    messageListVisibility: MessageListVisibility,
    labelListVisibility: LabelListVisibility,
    type: LabelType,
    messagesTotal: number,
    messagesUnread: number,
    threadsTotal: number,
    threadsUnread: number,
    color: {
        textColor: string,
        backgroundColor: string
    }

}