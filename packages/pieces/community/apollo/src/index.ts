
import { createPiece, PieceAuth } from "@ensemble/pieces-framework";
import { matchPerson } from "./lib/actions/match-person";
import { enrichCompany } from "./lib/actions/enrich-company";

export const apolloAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

export const apollo = createPiece({
  displayName: "Apollo",
  auth: apolloAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.ensemble.com/pieces/apollo.png",
  authors: ['abuaboud'],
  actions: [matchPerson, enrichCompany],
  triggers: [],
});
