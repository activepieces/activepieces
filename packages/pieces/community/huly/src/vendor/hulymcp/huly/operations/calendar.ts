/**
 * Calendar domain operations — one-time event CRUD + barrel re-export.
 *
 * Split into:
 * - calendar-shared: shared helpers (SDK bridges, participant resolution, etc.)
 * - calendar (this file): one-time event CRUD (list, get, create, update, delete)
 * - calendar-recurring: recurring event ops (list, create, list instances)
 *
 * @module
 */
import { AccessLevel, type Event as HulyEvent, generateEventId } from "@hcengineering/calendar"
import type { AttachedData, Class, Doc, DocumentQuery, DocumentUpdate, Space } from "@hcengineering/core"
import { SortingOrder } from "@hcengineering/core"
import { Effect } from "effect"

import type {
  CreateEventParams,
  CreateEventResult,
  DeleteEventParams,
  DeleteEventResult,
  Event,
  EventSummary,
  GetEventParams,
  ListEventsParams,
  UpdateEventParams,
  UpdateEventResult
} from "../../domain/schemas/calendar.js"
import { Email, EventId } from "../../domain/schemas/shared.js"
import { HulyClient, type HulyClientError } from "../client.js"
import { EventNotFoundError } from "../errors.js"
import { calendar, core } from "../huly-plugins.js"
import {
  buildParticipants,
  descriptionAsMarkupRef,
  emptyEventDescription,
  markupRefAsDescription,
  ONE_HOUR_MS,
  resolveEventInputs,
  serverPopulatedUser,
  stringToVisibility,
  visibilityToString
} from "./calendar-shared.js"
import { clampLimit, toRef } from "./shared.js"

// Re-export recurring operations for barrel consumers
export { createRecurringEvent, listEventInstances, listRecurringEvents } from "./calendar-recurring.js"

// --- Error types ---

type ListEventsError = HulyClientError
type GetEventError = HulyClientError | EventNotFoundError
type CreateEventError = HulyClientError
type UpdateEventError = HulyClientError | EventNotFoundError
type DeleteEventError = HulyClientError | EventNotFoundError

// --- Operations ---

export const listEvents = (
  params: ListEventsParams
): Effect.Effect<Array<EventSummary>, ListEventsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const query: DocumentQuery<HulyEvent> = {}

    if (params.from !== undefined) {
      query.date = { $gte: params.from }
    }

    if (params.to !== undefined) {
      query.dueDate = { $lte: params.to }
    }

    const limit = clampLimit(params.limit)

    const events = yield* client.findAll<HulyEvent>(
      calendar.class.Event,
      query,
      {
        limit,
        sort: { date: SortingOrder.Ascending }
      }
    )

    const summaries: Array<EventSummary> = events.map(event => ({
      eventId: EventId.make(event.eventId),
      title: event.title,
      date: event.date,
      dueDate: event.dueDate,
      allDay: event.allDay,
      location: event.location,
      modifiedOn: event.modifiedOn
    }))

    return summaries
  })

export const getEvent = (
  params: GetEventParams
): Effect.Effect<Event, GetEventError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const event = yield* client.findOne<HulyEvent>(
      calendar.class.Event,
      { eventId: params.eventId }
    )

    if (event === undefined) {
      return yield* new EventNotFoundError({ eventId: params.eventId })
    }

    const participants = yield* buildParticipants(client, event.participants)

    const description: string | undefined = event.description
      ? yield* client.fetchMarkup(
        calendar.class.Event,
        event._id,
        "description",
        descriptionAsMarkupRef(event.description),
        "markdown"
      )
      : undefined

    const result: Event = {
      eventId: EventId.make(event.eventId),
      title: event.title,
      description,
      date: event.date,
      dueDate: event.dueDate,
      allDay: event.allDay,
      location: event.location,
      visibility: visibilityToString(event.visibility),
      participants,
      externalParticipants: (event.externalParticipants || []).map(p => Email.make(p)),
      calendarId: event.calendar,
      modifiedOn: event.modifiedOn,
      createdOn: event.createdOn
    }

    return result
  })

export const createEvent = (
  params: CreateEventParams
): Effect.Effect<CreateEventResult, CreateEventError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const eventId = generateEventId()
    const dueDate = params.dueDate ?? (params.date + ONE_HOUR_MS)

    const { calendarRef, descriptionRef, participantRefs } = yield* resolveEventInputs(
      client,
      params,
      calendar.class.Event,
      eventId
    )

    const eventData: AttachedData<HulyEvent> = {
      eventId,
      title: params.title,
      description: markupRefAsDescription(descriptionRef),
      date: params.date,
      dueDate,
      allDay: params.allDay ?? false,
      calendar: calendarRef,
      participants: participantRefs,
      externalParticipants: [],
      access: AccessLevel.Owner,
      user: serverPopulatedUser,
      blockTime: false
    }

    if (params.location !== undefined) {
      eventData.location = params.location
    }

    if (params.visibility !== undefined) {
      const vis = stringToVisibility(params.visibility)
      if (vis !== undefined) {
        eventData.visibility = vis
      }
    }

    yield* client.addCollection(
      calendar.class.Event,
      toRef<Space>(calendar.space.Calendar),
      toRef<Doc>(calendar.space.Calendar),
      toRef<Class<Doc>>(core.class.Space),
      "events",
      eventData
    )

    return { eventId: EventId.make(eventId) }
  })

export const updateEvent = (
  params: UpdateEventParams
): Effect.Effect<UpdateEventResult, UpdateEventError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const event = yield* client.findOne<HulyEvent>(
      calendar.class.Event,
      { eventId: params.eventId }
    )

    if (event === undefined) {
      return yield* new EventNotFoundError({ eventId: params.eventId })
    }

    const updateOps: DocumentUpdate<HulyEvent> = {}
    let descriptionUpdatedInPlace = false

    if (params.title !== undefined) {
      updateOps.title = params.title
    }

    if (params.description !== undefined) {
      if (params.description.trim() === "") {
        updateOps.description = emptyEventDescription
      } else if (event.description) {
        yield* client.updateMarkup(
          calendar.class.Event,
          event._id,
          "description",
          params.description,
          "markdown"
        )
        descriptionUpdatedInPlace = true
      } else {
        const descriptionRef = yield* client.uploadMarkup(
          calendar.class.Event,
          event._id,
          "description",
          params.description,
          "markdown"
        )
        updateOps.description = markupRefAsDescription(descriptionRef)
      }
    }

    if (params.date !== undefined) {
      updateOps.date = params.date
    }

    if (params.dueDate !== undefined) {
      updateOps.dueDate = params.dueDate
    }

    if (params.allDay !== undefined) {
      updateOps.allDay = params.allDay
    }

    if (params.location !== undefined) {
      updateOps.location = params.location
    }

    if (params.visibility !== undefined) {
      const vis = stringToVisibility(params.visibility)
      if (vis !== undefined) {
        updateOps.visibility = vis
      }
    }

    if (Object.keys(updateOps).length === 0 && !descriptionUpdatedInPlace) {
      return { eventId: EventId.make(params.eventId), updated: false }
    }

    if (Object.keys(updateOps).length > 0) {
      yield* client.updateDoc(
        calendar.class.Event,
        event.space,
        event._id,
        updateOps
      )
    }

    return { eventId: EventId.make(params.eventId), updated: true }
  })

export const deleteEvent = (
  params: DeleteEventParams
): Effect.Effect<DeleteEventResult, DeleteEventError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const event = yield* client.findOne<HulyEvent>(
      calendar.class.Event,
      { eventId: params.eventId }
    )

    if (event === undefined) {
      return yield* new EventNotFoundError({ eventId: params.eventId })
    }

    yield* client.removeDoc(
      calendar.class.Event,
      event.space,
      event._id
    )

    return { eventId: EventId.make(params.eventId), deleted: true }
  })
