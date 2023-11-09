import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { PieceAuth, Property, SecretTextProperty, ShortTextProperty, StaticPropsValue } from "@activepieces/pieces-framework";

export type SendyAuthType = {apiKey: string, domain: string}

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

const validateAuth = async (auth: SendyAuthType) => {
	const response = await getBrands(auth);
	if (response.success !== true) {
		throw new Error('Authentication failed. Please check your domain and API key and try again.');
	}
}

const sendyPostAPI = async (
		api  : string,
		auth : StaticPropsValue<{ domain: ShortTextProperty<true>; apiKey: SecretTextProperty<true>; }>,
		body : {[key: string]: string} = {},
	) => {
	const {apiKey, domain} = auth;
	body["api_key"] = apiKey;

	const request: HttpRequest = {
		method  : HttpMethod.POST,
		url     : `${domain}${api}`,
		headers : {'Content-Type' : 'application/x-www-form-urlencoded'},
		body    : body,
	};
	const response = await httpClient.sendRequest(request);

	let data    = [];
	let success = false;

	// If the response is a JSON object, then we know that the request was successful
	if (typeof response.body === 'object') {
		data = Object.keys(response.body).map(key => response.body[key]);
		success = true;
	}

	return {
		success : success,
		status  : response.status,
		data    : data,
		error   : typeof response.body === 'object' ? "" : response.body as string,
	};
}

export async function buildBrandDropdown(auth: SendyAuthType) {
	// if (!auth) {
	// 	return {
	// 		disabled: true
	// 	};
	// }
	const response = await getBrands(auth as SendyAuthType);
	const options = response.data.map(brand => {
		return { label: brand.name, value: brand.id }
	});
	return {
		options: options,
	};
}

export async function getBrands(auth: SendyAuthType) {
	const api = '/api/brands/get-brands.php';
	return sendyPostAPI(api, auth);
}

export async function getLists(auth : SendyAuthType, brandId = '1', includeHidden = 'no' ) {
	const api = '/api/lists/get-lists.php';
	return sendyPostAPI(api, auth, { brand_id : brandId, include_hidden : includeHidden });
}