import { AuthenticationType, createTrigger, DedupeStrategy, httpClient, HttpMethod, OAuth2PropertyValue, Polling, pollingHelper, Property, } from "@activepieces/framework";
import { TriggerStrategy } from "@activepieces/shared";
import dayjs from "dayjs";

export const newContact = createTrigger({
    name: "new_contact",
    displayName: "New Contact",
    description: "Triggers when a new contact is created",
    sampleData: {
        "Owner": {
            "name": "Activepieces Apps",
            "id": "560094000000343001",
            "email": "apps@activepieces.com"
        },
        "Email": "capla-paprocki@yahoo.com",
        "Description": null,
        "$currency_symbol": "$",
        "Vendor_Name": null,
        "Mailing_Zip": "99501",
        "$field_states": null,
        "Other_Phone": null,
        "Mailing_State": "AK",
        "$review_process": {
            "approve": false,
            "reject": false,
            "resubmit": false
        },
        "Twitter": "lpaprocki_sample",
        "Other_Zip": null,
        "Mailing_Street": "639 Main St",
        "Other_State": null,
        "$sharing_permission": "full_access",
        "Salutation": null,
        "Other_Country": null,
        "Last_Activity_Time": "2023-03-26T00:02:28+01:00",
        "First_Name": "Capla",
        "Full_Name": "Capla Paprocki (Sample)",
        "Asst_Phone": null,
        "Record_Image": "d7d6bec0cbbfd9f3b84ebcd2eba41e9fa432f48560f9ed267b2e5b26eb58a07f5451e24ca9042b39f05459c41291c005b0dea6b224d375a6030f4096eb631fa3d4dcabb97393f1dc2470eb1658164f05",
        "Department": "Admin",
        "Modified_By": {
            "name": "Activepieces Apps",
            "id": "560094000000343001",
            "email": "apps@activepieces.com"
        },
        "$review": null,
        "$state": "save",
        "Skype_ID": "lpaprocki",
        "Unsubscribed_Mode": null,
        "$process_flow": false,
        "Assistant": null,
        "Phone": "555-555-5555",
        "Mailing_Country": "United States",
        "id": "560094000000349199",
        "Reporting_To": null,
        "$approval": {
            "delegate": false,
            "approve": false,
            "reject": false,
            "resubmit": false
        },
        "Enrich_Status__s": null,
        "Other_City": null,
        "Created_Time": "2023-03-26T00:01:56+01:00",
        "$wizard_connection_path": null,
        "$editable": true,
        "Home_Phone": null,
        "Created_By": {
            "name": "Activepieces Apps",
            "id": "560094000000343001",
            "email": "apps@activepieces.com"
        },
        "$zia_owner_assignment": "owner_recommendation_unavailable",
        "Secondary_Email": null
    },
    type: TriggerStrategy.POLLING,
    props: {
        authentication: Property.OAuth2({
            props: {
                location: Property.StaticDropdown({
                    displayName: "Location",
                    description: "The location of your Zoho CRM account",
                    required: true,
                    options: {
                        options: [
                            {
                                label: "zoho.eu",
                                value: "zoho.eu"
                            },
                            {
                                label: "zoho.com",
                                value: "zoho.com"
                            },
                            {
                                label: "zoho.com.au",
                                value: "zoho.com.au"
                            },
                            {
                                label: "zoho.jp",
                                value: "zoho.jp"
                            }
                        ]
                    }
                })
            },
            displayName: "Authentication",
            description: "Authentication for Zoho CRM",
            scope: ["ZohoCRM.modules.READ"], // Todo Fix this
            authUrl: "https://accounts.{location}/oauth/v2/auth",
            tokenUrl: "https://accounts.zoho.eu/oauth/v2/token",
            required: true,
        })
    },
    async run(context) {
        return await pollingHelper.poll(polling, { store: context.store, propsValue: context.propsValue });
    },
    async test({ propsValue, store }): Promise<unknown[]> {
        return await pollingHelper.test(polling, { store: store, propsValue: propsValue });
    },
    async onEnable({ propsValue, store, setSchedule }): Promise<void> {
        await pollingHelper.onEnable(polling, { store: store, propsValue: propsValue });
    },
    async onDisable({ propsValue, store }): Promise<void> {
        await pollingHelper.onDisable(polling, { store: store, propsValue: propsValue });
    }
})


const polling: Polling<{ authentication: OAuth2PropertyValue }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue }) => {
        const response = await httpClient.sendRequest<{ data: { Created_Time: string }[] }>({
            url: `${propsValue.authentication['data']['api_domain']}/crm/v4/Contacts?perPage=200&fields=Owner,Email,$currency_symbol,$field_states,Other_Phone,Mailing_State,Other_State,$sharing_permission,Other_Country,Last_Activity_Time,Department,$state,Unsubscribed_Mode,$process_flow,Assistant,Mailing_Country,id,Reporting_To,$approval,Enrich_Status__s,Other_City,Created_Time,$wizard_connection_path,$editable,Home_Phone,Created_By,$zia_owner_assignment,Secondary_Email,Description,Vendor_Name,Mailing_Zip,$review_process,Twitter,Other_Zip,Mailing_Street,$canvas_id,Salutation,First_Name,Full_Name,Asst_Phone,Record_Image,Modified_By,$review,Skype_ID,Phone,Account_Name?sort_order=desc&sort_by=Created_Time`,
            method: HttpMethod.GET,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: propsValue.authentication.access_token
            }
        });
        return response.body.data.map((record) => ({
            epochMilliSeconds: dayjs(record.Created_Time).valueOf(),
            data: record,
        }));
    }
}

