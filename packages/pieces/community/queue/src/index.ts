import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { pushToQueue } from "./lib/actions/push-to-queue";
import { pullFromQueue } from "./lib/actions/pull-from-queue";
import { clearQueue } from "./lib/actions/clear-queue";
import { peekQueue } from "./lib/actions/peek-queue";
import { getQueueSize } from "./lib/actions/get-queue-size";

export const queue = createPiece({
  displayName: "Queue",
  description: "A piece that allows you to push items into a queue, providing a way to throttle requests or process data in a First-In-First-Out (FIFO) manner.",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/queue.svg',
  authors: ['AbdullahBitar'],
  actions: [pushToQueue, pullFromQueue, peekQueue, getQueueSize, clearQueue],
  triggers: [],
});
