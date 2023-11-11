
import { createPiece } from "@activepieces/pieces-framework";
import { sendyAuth } from "./lib/auth";
import { getBrandsAction } from "./lib/actions/getBrands";
import { getListsAction } from "./lib/actions/getLists";
import { subscribeAction } from "./lib/actions/subscribe";
import { unsubscribeAction } from "./lib/actions/unsubscribe";
import { deleteAction } from "./lib/actions/delete";
import { statusAction } from "./lib/actions/status";
import { countAction } from "./lib/actions/count";
import { createCampaignAction } from "./lib/actions/createCampaign";

export const sendy = createPiece({
	displayName             : "Sendy",
	auth                    : sendyAuth,
	minimumSupportedRelease : '0.9.0',
	logoUrl                 : "https://cdn.activepieces.com/pieces/sendy.png",
	authors                 : ["joeworkman"],
	actions                 : [
		countAction,
		createCampaignAction,
		deleteAction,
		getBrandsAction,
		getListsAction,
		statusAction,
		subscribeAction,
		unsubscribeAction,
	],
	triggers: [],
});

// Sendy APi docs: https://sendy.co/api