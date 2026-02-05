import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createEntity } from "./lib/actions/create-entity";
import { findOrCreateEntity } from "./lib/actions/find-or-create-entity";
import { findEntity } from "./lib/actions/find-entity";
import { entityEvent } from "./lib/triggers/entity-event";

export const base44Auth = PieceAuth.CustomAuth({
  description: `Authenticate with your Base44 app using your App ID and API token.

**App ID**: Your Base44 application ID (required)
**Token**: Your Base44 user token or service token (optional but recommended)

You can find these in your Base44 app settings or dashboard.`,
  displayName: 'Authentication',
  required: true,
  props: {
    appId: Property.ShortText({
      displayName: 'App ID',
      description: 'Your Base44 application ID',
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Base44 user token or service token (optional but recommended for full access)',
      required: false,
    }),
  },
});

export const base44 = createPiece({
  displayName: "Base44",
  description: "Build and manage custom apps with databases and entities",
  auth: base44Auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/base44.png",
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.PRODUCTIVITY],
  authors: ["onyedikachi-david"],
  actions: [
    createEntity,
    findEntity,
    findOrCreateEntity,
  ],
  triggers: [
    entityEvent,
  ],
});
