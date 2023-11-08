import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { PieceAuth, Property, SecretTextProperty, ShortTextProperty, StaticPropsValue } from "@activepieces/pieces-framework";

const markdownDescription = `
Your sendy domain should be the base URL of your Sendy installation. Example: https://sendy.example.com

Follow these instructions to get your Sendy API Key:

1. Visit the Settings page of your Sendy domain: _https://sendy-domain.com_/settings
2. Once on the website, locate and click on the API Key and copy it.
`;

export const sendyAuth = PieceAuth.CustomAuth({
    description: markdownDescription,
    props: {
        domain: Property.ShortText({
			displayName : 'Sendy Domain',
			description : 'The domain of your Sendy account',
			required    : true,
        }),
        apiKey: PieceAuth.SecretText({
			displayName : 'API Key',
			description : 'The API key for your Sendy account',
			required    : true,
        }),
    },
    // validate: async ({ auth }) => {
	// 	try {
	// 		const response = await getBrands(auth);
    //         return {
    //             valid : response.success,
    //         }
    //     } catch (e) {
    //         return {
    //             valid: false,
    //             error: (e as Error)?.message
    //         }
    //     }
    // },
    required : true
});

export async function sendyPostAPI(api: string, auth: StaticPropsValue<{ domain: ShortTextProperty<true>; apiKey: SecretTextProperty<true>; }>) {
	const {apiKey, domain} = auth;
	const request: HttpRequest = {
		method : HttpMethod.POST,
		url    : `${domain}${api}`,
		headers: {
			'Content-Type' : 'application/x-www-form-urlencoded',
		},
		body   : {
			api_key : apiKey,
		},
	};
	return await httpClient.sendRequest(request);
}

export async function getBrands(auth: StaticPropsValue<{ domain: ShortTextProperty<true>; apiKey: SecretTextProperty<true>; }>) {
	const api      = '/api/brands/get-brands.php';
	const response = await sendyPostAPI(api, auth);
	const brands   = Object.keys(response.body).map(key => response.body[key]);

	return {
		success : response.status === 200,
		status  : response.status,
		data    : brands,
	};
}