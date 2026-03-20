/**
 * Shared helpers for calendar operations.
 *
 * Used by both calendar-events (one-time) and calendar-recurring modules.
 *
 * @module
 */
import type {
  Calendar as HulyCalendar,
  Event as HulyEvent,
  Visibility as HulyVisibility
} from "@hcengineering/calendar"
import type { Channel, Contact, Person } from "@hcengineering/contact"
import type { Class, Doc, MarkupBlobRef, Ref } from "@hcengineering/core"
import { Effect } from "effect"

import type { Participant, Visibility } from "../../domain/schemas/calendar.js"
import { PersonId, PersonName } from "../../domain/schemas/shared.js"
import type { HulyClient, HulyClientError } from "../client.js"
import { calendar, contact } from "../huly-plugins.js"
import { toRef } from "./shared.js"

// --- SDK Type Bridges ---

// SDK: HulyEvent["description"] is Markup | MarkupBlobRef | null; fetchMarkup expects MarkupBlobRef.
// At runtime the value is always a MarkupBlobRef when non-empty; Markup (plain string) lacks the Ref<Blob> brand.
// eslint-disable-next-line no-restricted-syntax -- see above
export const descriptionAsMarkupRef = (desc: HulyEvent["description"]): MarkupBlobRef => desc as MarkupBlobRef

// SDK: MarkupBlobRef (Ref<Blob>) is assignable to Markup (string); null maps to empty string.
export const markupRefAsDescription = (
  ref: MarkupBlobRef | null
): HulyEvent["description"] => ref ?? ""

export const emptyEventDescription: HulyEvent["description"] = ""

// SDK: Data<Event> requires 'user' (PersonId, branded string) but server populates from auth context.
// PersonId = string & { __personId: true }; no SDK factory exists. Empty string is overwritten server-side.
// eslint-disable-next-line no-restricted-syntax -- see above
export const serverPopulatedUser: HulyEvent["user"] = "" as HulyEvent["user"]

// SDK: Visibility and HulyVisibility are identical string literal unions.
export const visibilityToString = (v: HulyVisibility | undefined): Visibility | undefined => v

export const stringToVisibility = (v: Visibility | undefined): HulyVisibility | undefined => v

// --- Constants ---

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const MS_PER_SECOND = 1000
export const ONE_HOUR_MS = SECONDS_PER_MINUTE * MINUTES_PER_HOUR * MS_PER_SECOND

// --- Helpers ---

const findPersonsByEmails = (
  client: HulyClient["Type"],
  emails: ReadonlyArray<string>
): Effect.Effect<Array<Person>, HulyClientError> =>
  Effect.gen(function*() {
    if (emails.length === 0) return []

    const allChannels = yield* client.findAll<Channel>(
      contact.class.Channel,
      { value: { $in: [...emails] } }
    )

    const personIds = [...new Set(allChannels.map(c => toRef<Person>(c.attachedTo)))]
    if (personIds.length === 0) return []

    const persons = yield* client.findAll<Person>(
      contact.class.Person,
      { _id: { $in: personIds } }
    )

    return persons
  })

const getDefaultCalendar = (
  client: HulyClient["Type"]
): Effect.Effect<HulyCalendar | undefined, HulyClientError> =>
  client.findOne<HulyCalendar>(
    calendar.class.Calendar,
    {}
  )

export const buildParticipants = (
  client: HulyClient["Type"],
  participantRefs: ReadonlyArray<Ref<Contact>>
): Effect.Effect<Array<Participant>, HulyClientError> =>
  Effect.gen(function*() {
    if (participantRefs.length === 0) return []

    const persons = yield* client.findAll<Person>(
      contact.class.Person,
      { _id: { $in: participantRefs.map(toRef<Person>) } }
    )

    return persons.map(p => ({
      id: PersonId.make(p._id),
      name: PersonName.make(p.name)
    }))
  })

interface ResolvedEventInputs {
  calendarRef: Ref<HulyCalendar>
  participantRefs: Array<Ref<Contact>>
  descriptionRef: MarkupBlobRef | null
}

export const resolveEventInputs = (
  client: HulyClient["Type"],
  params: {
    readonly participants?: ReadonlyArray<string> | undefined
    readonly description?: string | undefined
  },
  eventClass: Ref<Class<Doc>>,
  eventId: string
): Effect.Effect<ResolvedEventInputs, HulyClientError> =>
  Effect.gen(function*() {
    const cal = yield* getDefaultCalendar(client)
    const calendarRef = cal?._id ?? toRef<HulyCalendar>("")

    const participantRefs: Array<Ref<Contact>> = params.participants && params.participants.length > 0
      ? (yield* findPersonsByEmails(client, params.participants)).map(p => p._id)
      : []

    const descriptionRef: MarkupBlobRef | null = params.description && params.description.trim() !== ""
      ? yield* client.uploadMarkup(
        eventClass,
        toRef<Doc>(eventId),
        "description",
        params.description,
        "markdown"
      )
      : null

    return { calendarRef, participantRefs, descriptionRef }
  })
