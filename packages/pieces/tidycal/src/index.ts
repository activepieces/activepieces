import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { tidycalbookingcancelled  } from "./lib/trigger/cancelled-booking";
import { tidycalnewbooking } from "./lib/trigger/new-booking";
import { tidycalnewcontact } from "./lib/trigger/new-contacts";

export const tidyCalAuth = PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://tidycal.com/oauth/authorize',
	tokenUrl: 'https://tidycal.com/oauth/token',
	required: true,
	scope: ['']
});

export const tidycal = createPiece({
	displayName: "Tidycal",
	auth: tidyCalAuth,
	minimumSupportedRelease: '0.7.1',
	logoUrl: "https://cdn.activepieces.com/pieces/tidycal.png",
	authors: ["Salem-Alaa"],
	actions: [],
	triggers: [ tidycalbookingcancelled , tidycalnewbooking , tidycalnewcontact ],
});