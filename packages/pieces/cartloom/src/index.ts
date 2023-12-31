
import { createPiece } from "@activepieces/pieces-framework";
import { getProductsAction } from "./lib/actions/get-products";
import { cartloomAuth } from "./lib/auth";
import { getOrderAction } from "./lib/actions/get-order";
import { createDiscountAction } from "./lib/actions/create-discount";
import { getDiscountAction } from "./lib/actions/get-discount";
import { getAllDiscountsAction } from "./lib/actions/get-discounts";
import { getOrderDateAction } from "./lib/actions/get-orders-date";
import { getOrderEmailAction } from "./lib/actions/get-orders-date-email";

export const cartloom = createPiece({
	displayName             : "Cartloom",
	auth                    : cartloomAuth,
	minimumSupportedRelease : '0.9.0',
	logoUrl                 : "https://cdn.activepieces.com/pieces/cartloom.png",
	authors                 : ["joeworkman"],
	actions                 : [
		getProductsAction,
		getOrderAction,
		createDiscountAction,
		getDiscountAction,
		getAllDiscountsAction,
		getOrderDateAction,
		getOrderEmailAction,
	],
	triggers: [],
});
