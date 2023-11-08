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
    validate: async ({ auth }) => {
		try {
			await validateAuth(auth);
			return {
				valid : true,
			};
		} catch (e) {
			return {
				valid : false,
				error : (e as Error)?.message
			};
		}
    },
    required : true
});

const validateAuth = async (auth: StaticPropsValue<{ domain: ShortTextProperty<true>; apiKey: SecretTextProperty<true>; }>) => {
	const response = await getBrands(auth);
	if (response.success !== true) {
		throw new Error('Authentication failed. Please check your domain and API key and try again.');
	}
}

const sendyPostAPI = async (api: string, auth: StaticPropsValue<{ domain: ShortTextProperty<true>; apiKey: SecretTextProperty<true>; }>) => {
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
	const response = await httpClient.sendRequest(request);

	let data = response.body;
	let success = false;

	// If the response is a JSON object, then we know that the request was successful
	if (typeof data === 'object') {
		data = Object.keys(data).map(key => data[key]);
		success = true;
	}

	return {
		success : success,
		status  : response.status,
		data    : data,
	};
}

export async function getBrands(auth: StaticPropsValue<{ domain: ShortTextProperty<true>; apiKey: SecretTextProperty<true>; }>) {
	const api = '/api/brands/get-brands.php';
	return sendyPostAPI(api, auth);
}