import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { createAction, Property } from "@activepieces/pieces-framework";
import { sendyAuth, getBrands } from "../common";

export const getBrandsAction = createAction({
	name        : 'get-brands',
	auth        : sendyAuth,
	displayName : 'Get Brands',
	description : 'Get a list of brands from Sendy',
	props       : {},
	async run(context) {
		return await getBrands(context.auth);
	},
});
