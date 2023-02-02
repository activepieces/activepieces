import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMessageBody } from "../../../common/http/core/http-message-body";
import { HttpMethod } from "../../../common/http/core/http-method";
import { Property } from "../../../framework/property";

export const twilioCommon = {
    auth_token: Property.ShortText({
        description: "",
        displayName: 'Auth token',
        required: true,
    }),
    account_sid: Property.ShortText({
        description: "",
        displayName: 'Account SID',
        required: true,
    }),
}

export const callTwilioApi = async <T extends HttpMessageBody>(method: HttpMethod, path: string, auth: { account_sid: string, auth_token: string }, body?: any) => {
    return await httpClient.sendRequest<T>({
        method,
        url: `https://api.twilio.com/2010-04-01/Accounts/${auth.account_sid}/${path}`,
        authentication: {
            type: AuthenticationType.BASIC,
            username: auth.account_sid,
            password: auth.auth_token,
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    });
}