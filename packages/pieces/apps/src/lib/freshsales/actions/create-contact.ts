import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework"

export const freshSalesCreateContact = createAction({
  name: "freshsales_create_contact",
  displayName: "Create Contact",
  description: "Add new contact in Freshsales CRM",
  props: {
    token: Property.ShortText({
      displayName: "API Key",
      description: "The API Key supplied by Freshsales",
      required: true
    }),
    app_name: Property.ShortText({
      displayName: "App name",
      description: "Your app name",
      required: true
    }),
    first_name: Property.ShortText({
      displayName: "First name",
      description: "First name of the contact",
      required: true
    }),
    last_name: Property.ShortText({
      displayName: "Last name",
      description: "Last name of the contact",
      required: true
    }),
    job_title: Property.ShortText({
      displayName: "Job title",
      description: "Designation of the contact in the account they belong to",
      required: true
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Primary email address of the contact",
      required: false
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
      displayName: "Zipcode",
      description: "Zipcode of the region that the contact belongs to",
      required: false
    }),
    country: Property.ShortText({
      displayName: "country",
      description: "Country that the contact belongs to",
      required: false
    }),
    territory_id: Property.ShortText({
      displayName: "territory_id",
      description: "ID of the territory that the contact belongs to",
      required: false
    }),
    owner_id: Property.ShortText({
      displayName: "owner_id",
      description: "ID of the user to whom the contact has been assigned",
      required: false
    }),
    subscription_status: Property.ShortText({
      displayName: "subscription_status",
      description: "Status of subscription that the contact is in.",
      required: false
    }),
    medium: Property.ShortText({
      displayName: "medium",
      description: "The medium that led your contact to your website/web app",
      required: false
    }),
    campaign_id: Property.ShortText({
      displayName: "campaign_id",
      description: "The campaign that led your contact to your web app.",
      required: false
    }),
    keyword: Property.ShortText({
      displayName: "keyword",
      description: "The keywords that the contact used to reach your website/web app",
      required: false
    }),
    time_zone: Property.ShortText({
      displayName: "time_zone",
      description: "Timezone that the contact belongs to",
      required: false
    }),
    facebook: Property.ShortText({
      displayName: "facebook",
      description: "Facebook username of the contact",
      required: false
    }),
    twitter: Property.ShortText({
      displayName: "twitter",
      description: "Twitter username of the contact",
      required: false
    }),
    linkedin: Property.ShortText({
      displayName: "linkedin",
      description: "LinkedIn account of the contact",
      required: false
    }),
    contact_status_id: Property.ShortText({
      displayName: "contact_status_id",
      description: "ID of the contact status that the contact belongs to",
      required: false
    }),
    sales_account_id: Property.ShortText({
      displayName: "sales_account_id",
      description: "ID of the primary account that the contact belongs to",
      required: false
    })
  },
  sampleData: {},
  async run(context) {
    const { token, app_name, ...contact } = context.propsValue

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${app_name}.myfreshworks.com/crm/sales/api/contacts`,
      body: {
        contact
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
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