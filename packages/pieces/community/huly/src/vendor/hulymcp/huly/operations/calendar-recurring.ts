/**
 * Recurring calendar event operations: list recurring events, create, list instances.
 *
 * @module
 */
import {
  AccessLevel,
  generateEventId,
  type ReccuringEvent as HulyRecurringEvent,
  type ReccuringInstance as HulyRecurringInstance,
  type RecurringRule as HulyRecurringRule
} from "@hcengineering/calendar"
import type { AttachedData, Class, Doc, DocumentQuery, Space } from "@hcengineering/core"
import { SortingOrder } from "@hcengineering/core"
import { Effect } from "effect"

import type {
  CreateRecurringEventParams,
  CreateRecurringEventResult,
  EventInstance,
  ListEventInstancesParams,
  ListRecurringEventsParams,
  Participant,
  RecurringEventSummary,
  RecurringRule
} from "../../domain/schemas/calendar.js"
import { Email, EventId, PersonId } from "../../domain/schemas/shared.js"
import { HulyClient, type HulyClientError } from "../client.js"
import { RecurringEventNotFoundError } from "../errors.js"
import { calendar, core } from "../huly-plugins.js"
import {
  buildParticipants,
  markupRefAsDescription,
  ONE_HOUR_MS,
  resolveEventInputs,
  serverPopulatedUser,
  stringToVisibility,
  visibilityToString
} from "./calendar-shared.js"
import { clampLimit, toRef } from "./shared.js"

type ListRecurringEventsError = HulyClientError
type CreateRecurringEventError = HulyClientError
type ListEventInstancesError = HulyClientError | RecurringEventNotFoundError

const hulyRuleToRule = (rule: HulyRecurringRule): RecurringRule => ({
  freq: rule.freq,
  endDate: rule.endDate,
  count: rule.count,
  interval: rule.interval,
  byDay: rule.byDay,
  byMonthDay: rule.byMonthDay,
  byMonth: rule.byMonth,
  bySetPos: rule.bySetPos,
  wkst: rule.wkst
})

const ruleToHulyRule = (rule: RecurringRule): HulyRecurringRule => {
  const result: HulyRecurringRule = {
    freq: rule.freq
  }

  if (rule.endDate !== undefined) result.endDate = rule.endDate
  if (rule.count !== undefined) result.count = rule.count
  if (rule.interval !== undefined) result.interval = rule.interval
  if (rule.byDay !== undefined) result.byDay = [...rule.byDay]
  if (rule.byMonthDay !== undefined) result.byMonthDay = [...rule.byMonthDay]
  if (rule.byMonth !== undefined) result.byMonth = [...rule.byMonth]
  if (rule.bySetPos !== undefined) result.bySetPos = [...rule.bySetPos]
  if (rule.wkst !== undefined) result.wkst = rule.wkst

  return result
}

export const listRecurringEvents = (
  params: ListRecurringEventsParams
): Effect.Effect<Array<RecurringEventSummary>, ListRecurringEventsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const limit = clampLimit(params.limit)

    const events = yield* client.findAll<HulyRecurringEvent>(
      calendar.class.ReccuringEvent,
      {},
      {
        limit,
        sort: { modifiedOn: SortingOrder.Descending }
      }
    )

    const summaries: Array<RecurringEventSummary> = events.map(event => ({
      eventId: EventId.make(event.eventId),
      title: event.title,
      originalStartTime: event.originalStartTime,
      rules: event.rules.map(hulyRuleToRule),
      timeZone: event.timeZone,
      modifiedOn: event.modifiedOn
    }))

    return summaries
  })

export const createRecurringEvent = (
  params: CreateRecurringEventParams
): Effect.Effect<CreateRecurringEventResult, CreateRecurringEventError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const eventId = generateEventId()
    const dueDate = params.dueDate ?? (params.startDate + ONE_HOUR_MS)

    const { calendarRef, descriptionRef, participantRefs } = yield* resolveEventInputs(
      client,
      params,
      calendar.class.ReccuringEvent,
      eventId
    )

    const hulyRules = params.rules.map(ruleToHulyRule)

    const eventData: AttachedData<HulyRecurringEvent> = {
      eventId,
      title: params.title,
      description: markupRefAsDescription(descriptionRef),
      date: params.startDate,
      dueDate,
      allDay: params.allDay ?? false,
      calendar: calendarRef,
      participants: participantRefs,
      externalParticipants: [],
      access: AccessLevel.Owner,
      user: serverPopulatedUser,
      blockTime: false,
      rules: hulyRules,
      exdate: [],
      rdate: [],
      originalStartTime: params.startDate,
      timeZone: params.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
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
      calendar.class.ReccuringEvent,
      toRef<Space>(calendar.space.Calendar),
      toRef<Doc>(calendar.space.Calendar),
      toRef<Class<Doc>>(core.class.Space),
      "events",
      eventData
    )

    return { eventId: EventId.make(eventId) }
  })

export const listEventInstances = (
  params: ListEventInstancesParams
): Effect.Effect<Array<EventInstance>, ListEventInstancesError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const recurringEvent = yield* client.findOne<HulyRecurringEvent>(
      calendar.class.ReccuringEvent,
      { eventId: params.recurringEventId }
    )

    if (recurringEvent === undefined) {
      return yield* new RecurringEventNotFoundError({ eventId: params.recurringEventId })
    }

    const query: DocumentQuery<HulyRecurringInstance> = {
      recurringEventId: params.recurringEventId
    }

    if (params.from !== undefined) {
      query.date = { $gte: params.from }
    }

    if (params.to !== undefined) {
      query.dueDate = { $lte: params.to }
    }

    const limit = clampLimit(params.limit)

    const instances = yield* client.findAll<HulyRecurringInstance>(
      calendar.class.ReccuringInstance,
      query,
      {
        limit,
        sort: { date: SortingOrder.Ascending }
      }
    )

    const participantMap = new Map<string, Array<Participant>>()
    if (params.includeParticipants) {
      const allParticipantRefs = [...new Set(instances.flatMap(i => i.participants))]
      if (allParticipantRefs.length > 0) {
        const participants = yield* buildParticipants(client, allParticipantRefs)
        const participantById = new Map(participants.map(p => [p.id, p]))
        for (const instance of instances) {
          const instanceParticipants = instance.participants
            .map(ref => participantById.get(PersonId.make(ref)))
            .filter((p): p is Participant => p !== undefined)
          participantMap.set(instance.eventId, instanceParticipants)
        }
      } else {
        for (const instance of instances) {
          participantMap.set(instance.eventId, [])
        }
      }
    }

    const results: Array<EventInstance> = instances.map(instance => ({
      eventId: EventId.make(instance.eventId),
      recurringEventId: EventId.make(instance.recurringEventId),
      title: instance.title,
      date: instance.date,
      dueDate: instance.dueDate,
      originalStartTime: instance.originalStartTime,
      allDay: instance.allDay,
      location: instance.location,
      visibility: visibilityToString(instance.visibility),
      isCancelled: instance.isCancelled,
      isVirtual: instance.virtual,
      participants: params.includeParticipants ? (participantMap.get(instance.eventId) ?? []) : undefined,
      externalParticipants: instance.externalParticipants
        ? instance.externalParticipants.map(p => Email.make(p))
        : undefined
    }))

    return results
  })
