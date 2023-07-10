import { createPiece } from "@activepieces/pieces-framework";

import { customer } from "./lib/triggers/customer";
import { coupon } from "./lib/triggers/coupon";
import { order } from "./lib/triggers/order";
import { product } from "./lib/triggers/product";
import { lineItemInOrder } from "./lib/triggers/line-item-in-order";

export const woocommerce = createPiece({
    displayName: "WooCommerce",
    logoUrl: "https://cdn.activepieces.com/pieces/woocommerce.png",
    authors: ['MoShizzle'],
    actions: [],
    triggers: [customer, coupon, order, product, lineItemInOrder],
});
