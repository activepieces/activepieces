
import { createPiece } from "@activepieces/pieces-framework";
import { getBrandsAction } from "./lib/actions/get-brands";
import { sendyAuth } from "./lib/common";

export const sendy = createPiece({
	displayName             : "Sendy",
	auth                    : sendyAuth,
	minimumSupportedRelease : '0.9.0',
	logoUrl                 : "https://zapier-images.imgix.net/storage/developer/242e928e4b24ea7d0823b105c3e2bcb0_3.png",
	authors                 : ["joeworkman"],
	actions                 : [
		getBrandsAction,
	],
	triggers: [],
});
