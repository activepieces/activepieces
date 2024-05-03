import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { pushToQueue } from "./lib/actions/push-to-queue";
import { pullToQueue } from "./lib/actions/pull-from-queue";

export const queue = createPiece({
  displayName: "Queue",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/queue.svg',
  authors: ['AbdullahBitar'],
  actions: [pushToQueue, pullToQueue],
  triggers: [],
});
