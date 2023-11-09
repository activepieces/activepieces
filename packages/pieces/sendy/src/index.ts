
import { createPiece } from "@activepieces/pieces-framework";
import { sendyAuth } from "./lib/common";
import { getBrandsAction } from "./lib/actions/get-brands";
import { getListsAction } from "./lib/actions/get-lists";

export const sendy = createPiece({
	displayName             : "Sendy",
	auth                    : sendyAuth,
	minimumSupportedRelease : '0.9.0',
	logoUrl                 : "https://zapier-images.imgix.net/storage/developer/242e928e4b24ea7d0823b105c3e2bcb0_3.png",
	authors                 : ["joeworkman"],
	actions                 : [
		getBrandsAction,
		getListsAction,
	],
	triggers: [],
});

// Sendy APi docs: https://sendy.co/api