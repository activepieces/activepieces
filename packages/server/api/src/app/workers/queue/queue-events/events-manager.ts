import { Queue, QueueEvents } from "bullmq"
import { saveQueueMetrics } from "./save-queue-metrics"
import { FastifyBaseLogger } from "fastify"

export type EventsManager = {
  attach(): void
  detach(): void
}

export enum EventsHandlerType { // each handler will have its own logic 
  SAVE_METRICS = 'saveMetrics',
}

export const EventsTypeHandlerMapper: { 
  [K in EventsHandlerType]: (log: FastifyBaseLogger, queue: QueueEvents) => EventsManager 
} = {
  saveMetrics: saveQueueMetrics,
}