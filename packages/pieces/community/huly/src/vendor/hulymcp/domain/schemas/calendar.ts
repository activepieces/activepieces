import { JSONSchema, Schema } from "effect"

import { Email, EventId, LimitParam, NonEmptyString, Timestamp } from "./shared.js"
import type { PersonId, PersonName } from "./shared.js"

export const VisibilityValues = ["public", "freeBusy", "private"] as const

export const VisibilitySchema = Schema.Literal(...VisibilityValues).annotations({
  title: "Visibility",
  description: "Event visibility level"
})

export type Visibility = Schema.Schema.Type<typeof VisibilitySchema>

export const RecurringFrequencyValues = [
  "SECONDLY",
  "MINUTELY",
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY"
] as const

export const RecurringFrequencySchema = Schema.Literal(...RecurringFrequencyValues).annotations({
  title: "RecurringFrequency",
  description: "Recurring event frequency (RFC5545)"
})

export type RecurringFrequency = Schema.Schema.Type<typeof RecurringFrequencySchema>

export const WeekdayValues = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const

export const WeekdaySchema = Schema.Literal(...WeekdayValues).annotations({
  title: "Weekday",
  description: "Day of week abbreviation"
})

export type Weekday = Schema.Schema.Type<typeof WeekdaySchema>

export const RecurringRuleSchema = Schema.Struct({
  freq: RecurringFrequencySchema.annotations({
    description: "Frequency (DAILY, WEEKLY, MONTHLY, YEARLY, etc.)"
  }),
  endDate: Schema.optional(Timestamp.annotations({
    description: "End date for recurrence (timestamp)"
  })),
  count: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
      description: "Number of occurrences"
    })
  ),
  interval: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive()).annotations({
      description: "Interval between occurrences"
    })
  ),
  // RFC5545 allows ordinal prefixes (e.g. "2MO", "-1FR"), so plain WeekdaySchema won't work here
  byDay: Schema.optional(
    Schema.Array(Schema.String).annotations({
      description: "Days of week (e.g., ['MO', 'WE', 'FR'] or ['1MO', '-1FR'])"
    })
  ),
  byMonthDay: Schema.optional(
    Schema.Array(Schema.Number.pipe(Schema.int())).annotations({
      description: "Days of month (1-31 or -31 to -1)"
    })
  ),
  byMonth: Schema.optional(
    Schema.Array(Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(12))) // eslint-disable-line no-magic-numbers
      .annotations({
        description: "Months (1-12)"
      })
  ),
  bySetPos: Schema.optional(
    Schema.Array(Schema.Number.pipe(Schema.int())).annotations({
      description: "Position within set (e.g., -1 for last)"
    })
  ),
  wkst: Schema.optional(WeekdaySchema.annotations({
    description: "Week start day"
  }))
}).annotations({
  title: "RecurringRule",
  description: "RFC5545 recurring rule"
})

export type RecurringRule = Schema.Schema.Type<typeof RecurringRuleSchema>

// No codec needed — internal type, not used for runtime validation
export interface Participant {
  readonly id: PersonId
  readonly name?: PersonName | undefined
  readonly email?: Email | undefined
}

export interface EventSummary {
  readonly eventId: EventId
  readonly title: string
  readonly date: number
  readonly dueDate: number
  readonly allDay: boolean
  readonly location?: string | undefined
  readonly modifiedOn?: number | undefined
}

export interface Event {
  readonly eventId: EventId
  readonly title: string
  readonly description?: string | undefined
  readonly date: number
  readonly dueDate: number
  readonly allDay: boolean
  readonly location?: string | undefined
  readonly visibility?: Visibility | undefined
  readonly participants?: ReadonlyArray<Participant> | undefined
  readonly externalParticipants?: ReadonlyArray<Email> | undefined
  readonly calendarId?: string | undefined
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export interface RecurringEventSummary {
  readonly eventId: EventId
  readonly title: string
  readonly originalStartTime: number
  readonly rules: ReadonlyArray<RecurringRule>
  readonly timeZone?: string | undefined
  readonly modifiedOn?: number | undefined
}

export interface RecurringEvent {
  readonly eventId: EventId
  readonly title: string
  readonly description?: string | undefined
  readonly originalStartTime: number
  readonly rules: ReadonlyArray<RecurringRule>
  readonly exdate?: ReadonlyArray<number> | undefined
  readonly rdate?: ReadonlyArray<number> | undefined
  readonly timeZone?: string | undefined
  readonly dueDate: number
  readonly allDay: boolean
  readonly location?: string | undefined
  readonly visibility?: Visibility | undefined
  readonly participants?: ReadonlyArray<Participant> | undefined
  readonly externalParticipants?: ReadonlyArray<Email> | undefined
  readonly calendarId?: string | undefined
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export interface EventInstance {
  readonly eventId: EventId
  readonly recurringEventId: EventId
  readonly title: string
  readonly description?: string | undefined
  readonly date: number
  readonly dueDate: number
  readonly originalStartTime: number
  readonly allDay: boolean
  readonly location?: string | undefined
  readonly visibility?: Visibility | undefined
  readonly isCancelled?: boolean | undefined
  readonly isVirtual?: boolean | undefined
  readonly participants?: ReadonlyArray<Participant> | undefined
  readonly externalParticipants?: ReadonlyArray<Email> | undefined
}

// --- Params schemas ---

export const ListEventsParamsSchema = Schema.Struct({
  from: Schema.optional(Timestamp.annotations({
    description: "Start date filter (timestamp)"
  })),
  to: Schema.optional(Timestamp.annotations({
    description: "End date filter (timestamp)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of events to return (default: 50)"
    })
  )
}).annotations({
  title: "ListEventsParams",
  description: "Parameters for listing events"
})

export type ListEventsParams = Schema.Schema.Type<typeof ListEventsParamsSchema>

export const GetEventParamsSchema = Schema.Struct({
  eventId: EventId.annotations({
    description: "Event ID"
  })
}).annotations({
  title: "GetEventParams",
  description: "Parameters for getting a single event"
})

export type GetEventParams = Schema.Schema.Type<typeof GetEventParamsSchema>

export const CreateEventParamsSchema = Schema.Struct({
  title: NonEmptyString.annotations({
    description: "Event title"
  }),
  description: Schema.optional(Schema.String.annotations({
    description: "Event description (markdown supported)"
  })),
  date: Timestamp.annotations({
    description: "Start date/time (timestamp)"
  }),
  dueDate: Schema.optional(Timestamp.annotations({
    description: "End date/time (timestamp). If not provided, defaults to date + 1 hour"
  })),
  allDay: Schema.optional(Schema.Boolean.annotations({
    description: "All-day event (default: false)"
  })),
  location: Schema.optional(Schema.String.annotations({
    description: "Event location"
  })),
  participants: Schema.optional(
    Schema.Array(Email).annotations({
      description: "Participant emails"
    })
  ),
  visibility: Schema.optional(VisibilitySchema.annotations({
    description: "Event visibility (public, freeBusy, private)"
  }))
}).annotations({
  title: "CreateEventParams",
  description: "Parameters for creating an event"
})

export type CreateEventParams = Schema.Schema.Type<typeof CreateEventParamsSchema>

export const UpdateEventParamsSchema = Schema.Struct({
  eventId: EventId.annotations({
    description: "Event ID"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "New event title"
  })),
  description: Schema.optional(Schema.String.annotations({
    description: "New event description (markdown supported)"
  })),
  date: Schema.optional(Timestamp.annotations({
    description: "New start date/time (timestamp)"
  })),
  dueDate: Schema.optional(Timestamp.annotations({
    description: "New end date/time (timestamp)"
  })),
  allDay: Schema.optional(Schema.Boolean.annotations({
    description: "All-day event"
  })),
  location: Schema.optional(Schema.String.annotations({
    description: "New event location"
  })),
  visibility: Schema.optional(VisibilitySchema.annotations({
    description: "New event visibility"
  }))
}).annotations({
  title: "UpdateEventParams",
  description: "Parameters for updating an event"
})

export type UpdateEventParams = Schema.Schema.Type<typeof UpdateEventParamsSchema>

export const DeleteEventParamsSchema = Schema.Struct({
  eventId: EventId.annotations({
    description: "Event ID"
  })
}).annotations({
  title: "DeleteEventParams",
  description: "Parameters for deleting an event"
})

export type DeleteEventParams = Schema.Schema.Type<typeof DeleteEventParamsSchema>

export const ListRecurringEventsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of recurring events to return (default: 50)"
    })
  )
}).annotations({
  title: "ListRecurringEventsParams",
  description: "Parameters for listing recurring events"
})

export type ListRecurringEventsParams = Schema.Schema.Type<typeof ListRecurringEventsParamsSchema>

export const CreateRecurringEventParamsSchema = Schema.Struct({
  title: NonEmptyString.annotations({
    description: "Event title"
  }),
  description: Schema.optional(Schema.String.annotations({
    description: "Event description (markdown supported)"
  })),
  startDate: Timestamp.annotations({
    description: "First occurrence start date/time (timestamp)"
  }),
  dueDate: Schema.optional(Timestamp.annotations({
    description: "First occurrence end date/time (timestamp). If not provided, defaults to startDate + 1 hour"
  })),
  rules: Schema.NonEmptyArray(RecurringRuleSchema).annotations({
    description: "Recurring rules (RFC5545 RRULE format)"
  }),
  allDay: Schema.optional(Schema.Boolean.annotations({
    description: "All-day event (default: false)"
  })),
  location: Schema.optional(Schema.String.annotations({
    description: "Event location"
  })),
  participants: Schema.optional(
    Schema.Array(Email).annotations({
      description: "Participant emails"
    })
  ),
  timeZone: Schema.optional(Schema.String.annotations({
    description: "Time zone (e.g., 'America/New_York')"
  })),
  visibility: Schema.optional(VisibilitySchema.annotations({
    description: "Event visibility (public, freeBusy, private)"
  }))
}).annotations({
  title: "CreateRecurringEventParams",
  description: "Parameters for creating a recurring event"
})

export type CreateRecurringEventParams = Schema.Schema.Type<typeof CreateRecurringEventParamsSchema>

export const ListEventInstancesParamsSchema = Schema.Struct({
  recurringEventId: EventId.annotations({
    description: "Recurring event ID"
  }),
  from: Schema.optional(Timestamp.annotations({
    description: "Start date filter (timestamp)"
  })),
  to: Schema.optional(Timestamp.annotations({
    description: "End date filter (timestamp)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of instances to return (default: 50)"
    })
  ),
  includeParticipants: Schema.optional(Schema.Boolean.annotations({
    description: "Include full participant info (requires extra lookups, default: off)"
  }))
}).annotations({
  title: "ListEventInstancesParams",
  description: "Parameters for listing instances of a recurring event"
})

export type ListEventInstancesParams = Schema.Schema.Type<typeof ListEventInstancesParamsSchema>

// --- JSON schemas for MCP ---

export const listEventsParamsJsonSchema = JSONSchema.make(ListEventsParamsSchema)
export const getEventParamsJsonSchema = JSONSchema.make(GetEventParamsSchema)
export const createEventParamsJsonSchema = JSONSchema.make(CreateEventParamsSchema)
export const updateEventParamsJsonSchema = JSONSchema.make(UpdateEventParamsSchema)
export const deleteEventParamsJsonSchema = JSONSchema.make(DeleteEventParamsSchema)
export const listRecurringEventsParamsJsonSchema = JSONSchema.make(ListRecurringEventsParamsSchema)
export const createRecurringEventParamsJsonSchema = JSONSchema.make(CreateRecurringEventParamsSchema)
export const listEventInstancesParamsJsonSchema = JSONSchema.make(ListEventInstancesParamsSchema)

// --- Parsers ---

export const parseListEventsParams = Schema.decodeUnknown(ListEventsParamsSchema)
export const parseGetEventParams = Schema.decodeUnknown(GetEventParamsSchema)
export const parseCreateEventParams = Schema.decodeUnknown(CreateEventParamsSchema)
export const parseUpdateEventParams = Schema.decodeUnknown(UpdateEventParamsSchema)
export const parseDeleteEventParams = Schema.decodeUnknown(DeleteEventParamsSchema)
export const parseListRecurringEventsParams = Schema.decodeUnknown(ListRecurringEventsParamsSchema)
export const parseCreateRecurringEventParams = Schema.decodeUnknown(CreateRecurringEventParamsSchema)
export const parseListEventInstancesParams = Schema.decodeUnknown(ListEventInstancesParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface CreateEventResult {
  readonly eventId: EventId
}

export interface UpdateEventResult {
  readonly eventId: EventId
  readonly updated: boolean
}

export interface DeleteEventResult {
  readonly eventId: EventId
  readonly deleted: boolean
}

export interface CreateRecurringEventResult {
  readonly eventId: EventId
}
