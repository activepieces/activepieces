import { AuthenticationType } from "../../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../../common/http/core/http-client";
import { HttpMethod } from "../../../../common/http/core/http-method";
import { HttpRequest } from "../../../../common/http/core/http-request";
import { createAction } from "../../../../framework/action/action";
import { InputType } from "../../../../framework/config";
import { ConfigurationValue } from "../../../../framework/config/configuration-value.model";


export const createHubspotContact = createAction({
	name: 'create_contact',
	displayName: "Create Contact",
	description: "Create Contact",
	configs: [
		{
			name: 'authentication',
			description: "",
			displayName: 'Authentication',
			type: InputType.OAUTH2,
			authUrl: "https://app.hubspot.com/oauth/authorize",
			tokenUrl: "https://api.hubapi.com/oauth/v1/token",
			required: true,
			scopes: ["crm.objects.contacts.write"]
		},
		{
			name: 'firstName',
			displayName: 'First Name',
			description: 'First name of the new contact',
			type: InputType.SHORT_TEXT,
			required: true,
		},
        {
			name: 'lastName',
			displayName: 'Last Name',
			description: 'Last name of the new contact',
			type: InputType.SHORT_TEXT,
			required: true,
		},
        {
			name: 'zip',
			displayName: 'Zip Code',
			description: 'Zip code of the new contact',
			type: InputType.SHORT_TEXT,
			required: false,
		},
        {
			name: 'email',
			displayName: 'Email',
			description: 'Email of the new contact',
			type: InputType.SHORT_TEXT,
			required: false,
		},

		
	],
	async runner(configValue: ConfigurationValue) {
        const configsWIthoutAuthentication= {...configValue};
        delete configsWIthoutAuthentication['authentication'];
        const properties = Object.keys(configsWIthoutAuthentication).map(configKey=>{
            return {
                property: configKey,
                value:configsWIthoutAuthentication[configKey]
            }
        })
		const body = {
			properties: properties
		};
		const request: HttpRequest<{properties:{property:string, value:string}[]}> = {
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/contacts/v1/contact/',
			body: body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: configValue['authentication']['access_token'],
			},
			queryParams: {},
		};

		const result = await httpClient.sendRequest(request);

		return {
			success: true,
			request_body: body,
			response_body: result
		};
	},
});
