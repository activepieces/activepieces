
import { createPiece } from "@activepieces/pieces-framework";
import { sendyAuth } from "./lib/auth";
import { getBrandsAction } from "./lib/actions/get-brands";
import { getListsAction } from "./lib/actions/get-lists";
import { subscribeAction } from "./lib/actions/subscribe";
import { unsubscribeAction } from "./lib/actions/unsubscribe";
import { deleteAction } from "./lib/actions/delete";
import { statusAction } from "./lib/actions/status";

export const sendy = createPiece({
	displayName             : "Sendy",
	auth                    : sendyAuth,
	minimumSupportedRelease : '0.9.0',
	logoUrl                 : "https://zapier-images.imgix.net/storage/developer/242e928e4b24ea7d0823b105c3e2bcb0_3.png",
	authors                 : ["joeworkman"],
	actions                 : [
		getBrandsAction,
		getListsAction,
		subscribeAction,
		unsubscribeAction,
		deleteAction,
		statusAction,
	],
	triggers: [],
});

// Sendy APi docs: https://sendy.co/api