import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createSite = createAction({
  name: "create_site",
  displayName: "Create Site",
  description: "Creates a new site on Netlify",
  props: {
    name: Property.ShortText({
      displayName: "Site Name",
      description: "The name of the site (e.g., mysite.netlify.app)",
      required: true,
    }),
    customDomain: Property.ShortText({
      displayName: "Custom Domain",
      description: "The custom domain of the site (e.g., www.example.com)",
      required: false,
    }),
    password: Property.ShortText({
      displayName: "Password",
      description: "Password protect the site",
      required: false,
    }),
    forceSsl: Property.Checkbox({
      displayName: "Force SSL",
      description: "Will force SSL on the site if SSL is enabled",
      required: false,
      defaultValue: false,
    }),
    prettyUrls: Property.Checkbox({
      displayName: "Pretty URLs",
      description: "Enable Pretty URLs post processing setting",
      required: false,
      defaultValue: true,
    }),
    accountSlug: Property.ShortText({
      displayName: "Account Slug (Optional)",
      description: "Team account slug to create site in specific team. Leave empty for personal team.",
      required: false,
    }),
  },
  async run(context) {
    const { name, customDomain, password, forceSsl, prettyUrls, accountSlug } = context.propsValue;

    const siteData: any = {
      name,
      ...(customDomain && { custom_domain: customDomain }),
      ...(password && { password }),
      ...(forceSsl && { force_ssl: forceSsl }),
      ...(prettyUrls && {
        processing_settings: {
          html: { pretty_urls: prettyUrls },
        },
      }),
    };

    const url = accountSlug 
      ? `https://api.netlify.com/api/v1/${accountSlug}/sites`
      : "https://api.netlify.com/api/v1/sites";

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
        "Content-Type": "application/json",
      },
      body: siteData,
    });

    if (response.status === 200 || response.status === 201) {
      return response.body;
    }

    throw new Error(`Failed to create site: ${response.status} ${response.statusText}`);
  },
});
