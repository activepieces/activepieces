import { createAction } from "@activepieces/pieces-framework";
import { getBrands } from "../api";
import { sendyAuth } from "../auth";

export const getBrandsAction = createAction({
	name        : 'getBrands',
	auth        : sendyAuth,
	displayName : 'Get Brands',
	description : 'Get a list of brands from Sendy',
	props       : {},
	async run(context) {
		return await getBrands(context.auth);
	},
});
