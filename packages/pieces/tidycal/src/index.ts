import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { tidycalbookingcancelled } from "./lib/trigger/cancelled-booking";

// Cancelled Booking
	// Triggers when a booking is cancelled.
// New Booking
	// Triggers when a booking is created.
// New Contact
	// Triggers when a contact is added.
export const tidyCalAuth = PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://tidycal.com/oauth/authorize',
	tokenUrl: 'https://tidycal.com/oauth/token',
	required: true,
	scope: ['']
});

export const tidycal = createPiece({
	displayName: "Tidycal",
	auth: PieceAuth.None(),
	minimumSupportedRelease: '0.7.1',
	logoUrl: "https://cdn.activepieces.com/pieces/tidycal.png",
	authors: ["Salem-Alaa"],
	actions: [],
	triggers: [ tidycalbookingcancelled ],
});