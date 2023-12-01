
import { createPiece } from "@activepieces/pieces-framework";
import { bettermodeAuth } from "./lib/auth";
import { createDiscussionAction } from "./lib/actions/create-discussion";
import { createQuestionAction } from "./lib/actions/create-question";

export const bettermode = createPiece({
  displayName             : "Bettermode",
  auth                    : bettermodeAuth,
  minimumSupportedRelease : '0.9.0',
  logoUrl                 : "https://sandbox.joeworkman.net/bettermode.png",
  authors                 : ["joeworkman"],
  actions                 : [
	createDiscussionAction,
	createQuestionAction,
  ],
  triggers: [],
});

// Bettermode API docs: https://developers.bettermode.com/
