import {httpClient} from "../../../common/http/core/http-client";
import {HttpMethod} from "../../../common/http/core/http-method";
import {HttpRequest} from "../../../common/http/core/http-request";
import {Property} from "../../../framework/property/prop.model";

export async function getMailChimpServerPrefix(access_token:string)
{
    const mailChimpMetaDataRequest: HttpRequest<{dc:string}> = {
        method: HttpMethod.GET,
        url: 'https://login.mailchimp.com/oauth2/metadata',
        headers: {
            Authorization: `OAuth ${access_token}`
          }
    };
    return  (await httpClient.sendRequest(mailChimpMetaDataRequest)).body.dc;
}
export const mailChimpAuth =  Property.OAuth2({
    description: "",
    displayName: 'Authentication',
    authUrl: "https://login.mailchimp.com/oauth2/authorize",
    tokenUrl: "https://login.mailchimp.com/oauth2/token",
    required: true,
    scope: []
});