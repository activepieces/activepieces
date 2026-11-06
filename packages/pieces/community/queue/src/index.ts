import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { pushToQueue } from "./lib/actions/push-to-queue";
import { pullFromQueue } from "./lib/actions/pull-from-queue";
import { clearQueue } from "./lib/actions/clear-queue";
import { peekQueue } from "./lib/actions/peek-queue";
import { getQueueSize } from "./lib/actions/get-queue-size";

export const queue = createPiece({
  displayName: "Queue",
  description: "Hold items in a first-in, first-out queue shared across your flows.",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/queue.svg',
  authors: ['AbdullahBitar'],
  actions: [pushToQueue, pullFromQueue, peekQueue, getQueueSize, clearQueue],
  triggers: [],
});
