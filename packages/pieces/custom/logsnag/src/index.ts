
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { createEvent } from "./lib/actions/create-event";
    import { newEventCreated } from "./lib/triggers/new-event-created";

    export const logsnagAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your LogSnag API key specific to the project',
    });

    export const logsnag = createPiece({
      displayName: "Logsnag",
      auth: logsnagAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/logsnag.png",
      authors: [],
      actions: [createEvent],
      triggers: [newEventCreated],
    });