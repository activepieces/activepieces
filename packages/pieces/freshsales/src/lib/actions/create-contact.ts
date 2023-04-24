import { createAction, Property } from "@activepieces/pieces-framework"
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common"

const markdownDescription = `
To obtain your API key and bundle alias, follow these steps:

1. Log in to your Freshsales account.
2. Click on your profile icon in the top-right corner of the screen and select **Settings** from the dropdown menu.
3. In the settings menu, select **API Settings** from the left-hand navigation panel.
4. You should now see your API key displayed on the screen. If you don't see an API key.
5. Copy the alias e.g **https://<alias>.myfreshworks.com**
`

export const freshSalesCreateContact = createAction({
  name: "freshsales_create_contact",
  displayName: "Create Contact",
  description: "Add new contact in Freshsales CRM",
  props: {
    authentication: Property.BasicAuth({
      displayName: "Authentication",
      description: markdownDescription,
      username: Property.ShortText({
        displayName: "Bundle alias",
        description: "Your Freshsales bundle alias (e.g. https://<alias>.myfreshworks.com)",
        required: true
      }),
      password: Property.ShortText({
        displayName: "API Key",
        description: "The API Key supplied by Freshsales",
        required: true
      }),
      required: true
    }),
    first_name: Property.ShortText({
      displayName: "First name",
      description: "First name of the contact",
      required: false
    }),
    last_name: Property.ShortText({
      displayName: "Last name",
      description: "Last name of the contact",
      required: false
    }),
    job_title: Property.ShortText({
      displayName: "Job title",
      description: "Designation of the contact in the account they belong to",
      required: false
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Primary email address of the contact",
      required: true
    }),
    work_number: Property.ShortText({
      displayName: "Work number",
      description: "Work phone number of the contact",
      required: false
    }),
    mobile_number: Property.ShortText({
      displayName: "Mobile number",
      description: "Mobile phone number of the contact",
      required: false
    }),
    address: Property.ShortText({
      displayName: "Address",
      description: "Address of the contact",
      required: false
    }),
    city: Property.ShortText({
      displayName: "City",
      description: "City that the contact belongs to",
      required: false
    }),
    state: Property.ShortText({
      displayName: "State",
      description: "State that the contact belongs to",
      required: false
    }),
    zipcode: Property.ShortText({
      displayName: "Zip code",
      description: "Zipcode of the region that the contact belongs to",
      required: false
    }),
    country: Property.ShortText({
      displayName: "Country",
      description: "Country that the contact belongs to",
      required: false
    }),
    territory_id: Property.ShortText({
      displayName: "Territory id",
      description: "ID of the territory that the contact belongs to",
      required: false
    }),
    owner_id: Property.ShortText({
      displayName: "Owner id",
      description: "ID of the user to whom the contact has been assigned",
      required: false
    }),
    subscription_status: Property.ShortText({
      displayName: "Subscription status",
      description: "Status of subscription that the contact is in.",
      required: false
    }),
    medium: Property.ShortText({
      displayName: "Medium",
      description: "The medium that led your contact to your website/web app",
      required: false
    }),
    campaign_id: Property.ShortText({
      displayName: "Campaign id",
      description: "The campaign that led your contact to your web app.",
      required: false
    }),
    keyword: Property.ShortText({
      displayName: "Keyword",
      description: "The keywords that the contact used to reach your website/web app",
      required: false
    }),
    time_zone: Property.ShortText({
      displayName: "Timezone",
      description: "Timezone that the contact belongs to",
      required: false
    }),
    facebook: Property.ShortText({
      displayName: "Facebook",
      description: "Facebook username of the contact",
      required: false
    }),
    twitter: Property.ShortText({
      displayName: "Twitter",
      description: "Twitter username of the contact",
      required: false
    }),
    linkedin: Property.ShortText({
      displayName: "Linkedin",
      description: "LinkedIn account of the contact",
      required: false
    }),
    contact_status_id: Property.ShortText({
      displayName: "Contact status id",
      description: "ID of the contact status that the contact belongs to",
      required: false
    }),
    sales_account_id: Property.ShortText({
      displayName: "Sales account id",
      description: "ID of the primary account that the contact belongs to",
      required: false
    })
  },
  sampleData: {
    "contact": {
      "id": 2600053011,
      "first_name": "James",
      "last_name": "Blunt",
      "display_name": "James Blunt",
      "avatar": null,
      "job_title": "CEO",
      "city": null,
      "state": null,
      "zipcode": null,
      "country": null,
      "email": "test@gmail.com",
      "emails": [],
      "time_zone": null,
      "work_number": null,
      "mobile_number": null,
      "address": null,
      "last_seen": null,
      "lead_score": 0,
      "last_contacted": null,
      "open_deals_amount": null,
      "won_deals_amount": null,
      "links": {
        "conversations": "/crm/sales/contacts/16000530423/conversations/all?include=email_conversation_recipients%2Ctargetable%2Cphone_number%2Cphone_caller%2Cnote%2Cuser&per_page=3",
        "timeline_feeds": "/crm/sales/contacts/16000530423/timeline_feeds",
        "document_associations": "/crm/sales/contacts/16000530423/document_associations",
        "notes": "/crm/sales/contacts/16000530423/notes?include=creater",
        "tasks": "/crm/sales/contacts/16000530423/tasks?include=creater,owner,updater,targetable,users,task_type",
        "appointments": "/crm/sales/contacts/16000530423/appointments?include=creater,owner,updater,targetable,appointment_attendees,conference,note",
        "reminders": "/crm/sales/contacts/16000530423/reminders?include=creater,owner,updater,targetable",
        "duplicates": "/crm/sales/contacts/16000530423/duplicates",
        "connections": "/crm/sales/contacts/16000530423/connections"
      },
      "last_contacted_sales_activity_mode": null,
      "custom_field": {},
      "created_at": "2023-02-22T15:54:07Z",
      "updated_at": "2023-02-22T15:54:07Z",
      "keyword": null,
      "medium": null,
      "last_contacted_mode": null,
      "recent_note": null,
      "won_deals_count": 0,
      "last_contacted_via_sales_activity": null,
      "completed_sales_sequences": null,
      "active_sales_sequences": null,
      "web_form_ids": null,
      "open_deals_count": 0,
      "last_assigned_at": null,
      "facebook": null,
      "twitter": null,
      "linkedin": null,
      "is_deleted": false,
      "team_user_ids": null,
      "external_id": null,
      "work_email": null,
      "subscription_status": 1,
      "subscription_types": "2;3;4;5;1",
      "unsubscription_reason": null,
      "other_unsubscription_reason": null,
      "customer_fit": 0,
      "whatsapp_subscription_status": 2,
      "sms_subscription_status": 2,
      "last_seen_chat": null,
      "first_seen_chat": null,
      "locale": null,
      "total_sessions": null,
      "system_tags": [],
      "first_campaign": null,
      "first_medium": null,
      "first_source": null,
      "last_campaign": null,
      "last_medium": null,
      "last_source": null,
      "latest_campaign": null,
      "latest_medium": null,
      "latest_source": null,
      "mcr_id": 162842289578010620,
      "phone_numbers": [],
      "tags": []
    }
  },
  async run(context) {
    const { authentication, ...contact } = context.propsValue

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${authentication.username}.myfreshworks.com/crm/sales/api/contacts`,
      body: {
        contact
      },
      headers: {
        'Authorization': `Token token=${authentication.password}`
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Create contact response", result)

    if (result.status == 200) {
      return result.body
    } else {
      return result
    }
  }
})