import * as mailchimp from "@mailchimp/mailchimp_marketing";
import {httpClient} from "../../../common/http/core/http-client";
import {HttpMethod} from "../../../common/http/core/http-method";
import {HttpRequest} from "../../../common/http/core/http-request";
import {OAuth2PropertyValue, Property} from "../../../framework/property";

export const mailChimpAuth = Property.OAuth2({
  description: "",
  displayName: 'Authentication',
  authUrl: "https://login.mailchimp.com/oauth2/authorize",
  tokenUrl: "https://login.mailchimp.com/oauth2/token",
  required: true,
  scope: []
});

export const mailChimpListIdDropdown = Property.Dropdown<string>({
  displayName: "Audience",
  refreshers: ["authentication"],
  description: "Audience you want to add the contact to",
  required: true,
  options: async (propsValue) => {
    if (propsValue['authentication'] === undefined) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please select an authentication"
      }
    }

    const authProp = propsValue['authentication'] as OAuth2PropertyValue;
    const listResponse = await getUserLists(authProp);
    const options = listResponse.lists.map(list => ({
      label: list.name,
      value: list.id,
    }));

    return {
      disabled: false,
      options,
    };
  }
});

async function getUserLists(authProp: OAuth2PropertyValue): Promise<{ lists: MailChimpList[] }> {
  const access_token = authProp.access_token;
  const mailChimpServerPrefix = await getMailChimpServerPrefix(access_token!);
  mailchimp.setConfig({
    accessToken: access_token,
    server: mailChimpServerPrefix
  });

  console.log(`token:${access_token}`);
  console.log(`server ${mailChimpServerPrefix}`);

  // mailchimp types are not complete this is from the docs.
  return await (mailchimp as any).lists.getAllLists({
    fields: ["lists.id", "lists.name", "total_items"],
    count: 1000
  });
}

export async function getMailChimpServerPrefix(access_token: string) {
  const mailChimpMetaDataRequest: HttpRequest<{ dc: string }> = {
    method: HttpMethod.GET,
    url: 'https://login.mailchimp.com/oauth2/metadata',
    headers: {
      Authorization: `OAuth ${access_token}`
    }
  };
  return (await httpClient.sendRequest(mailChimpMetaDataRequest)).body["dc"];
}

interface MailChimpList {
  id: string;
  name: string;
}
