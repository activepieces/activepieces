import { JSONSchema, Schema } from "effect"

import type { NotificationTypeId } from "./shared.js"
import {
  LimitParam,
  NonEmptyString,
  NotificationContextId,
  NotificationId,
  NotificationProviderId,
  ObjectClassName
} from "./shared.js"

// No codec needed — internal type, not used for runtime validation
export interface NotificationSummary {
  readonly id: NotificationId
  readonly isViewed: boolean
  readonly archived: boolean
  readonly objectId?: string | undefined
  readonly objectClass?: ObjectClassName | undefined
  readonly title?: string | undefined
  readonly body?: string | undefined
  readonly createdOn?: number | undefined
  readonly modifiedOn?: number | undefined
}

export interface Notification {
  readonly id: NotificationId
  readonly isViewed: boolean
  readonly archived: boolean
  readonly objectId?: string | undefined
  readonly objectClass?: ObjectClassName | undefined
  readonly docNotifyContextId?: NotificationContextId | undefined
  readonly title?: string | undefined
  readonly body?: string | undefined
  readonly data?: string | undefined
  readonly createdOn?: number | undefined
  readonly modifiedOn?: number | undefined
}

export interface DocNotifyContextSummary {
  readonly id: NotificationContextId
  readonly objectId: string
  readonly objectClass: ObjectClassName
  readonly isPinned: boolean
  readonly hidden: boolean
  readonly lastViewedTimestamp?: number | undefined
  readonly lastUpdateTimestamp?: number | undefined
}

export interface NotificationProviderSetting {
  readonly id: string
  readonly providerId: NotificationProviderId
  readonly enabled: boolean
}

export interface NotificationTypeSetting {
  readonly id: string
  readonly providerId: NotificationProviderId
  readonly typeId: NotificationTypeId
  readonly enabled: boolean
}

// --- List Notifications Params ---

export const ListNotificationsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of notifications to return (default: 50)"
    })
  ),
  includeArchived: Schema.optional(
    Schema.Boolean.annotations({
      description: "Include archived notifications in results (default: false)"
    })
  ),
  unreadOnly: Schema.optional(
    Schema.Boolean.annotations({
      description: "Return only unread notifications (default: false)"
    })
  )
}).annotations({
  title: "ListNotificationsParams",
  description: "Parameters for listing notifications"
})

export type ListNotificationsParams = Schema.Schema.Type<typeof ListNotificationsParamsSchema>

// --- Get Notification Params ---

export const GetNotificationParamsSchema = Schema.Struct({
  notificationId: NotificationId.annotations({
    description: "Notification ID"
  })
}).annotations({
  title: "GetNotificationParams",
  description: "Parameters for getting a single notification"
})

export type GetNotificationParams = Schema.Schema.Type<typeof GetNotificationParamsSchema>

// --- Mark Notification Read Params ---

export const MarkNotificationReadParamsSchema = Schema.Struct({
  notificationId: NotificationId.annotations({
    description: "Notification ID to mark as read"
  })
}).annotations({
  title: "MarkNotificationReadParams",
  description: "Parameters for marking a notification as read"
})

export type MarkNotificationReadParams = Schema.Schema.Type<typeof MarkNotificationReadParamsSchema>

// --- Archive Notification Params ---

export const ArchiveNotificationParamsSchema = Schema.Struct({
  notificationId: NotificationId.annotations({
    description: "Notification ID to archive"
  })
}).annotations({
  title: "ArchiveNotificationParams",
  description: "Parameters for archiving a notification"
})

export type ArchiveNotificationParams = Schema.Schema.Type<typeof ArchiveNotificationParamsSchema>

// --- Delete Notification Params ---

export const DeleteNotificationParamsSchema = Schema.Struct({
  notificationId: NotificationId.annotations({
    description: "Notification ID to delete"
  })
}).annotations({
  title: "DeleteNotificationParams",
  description: "Parameters for deleting a notification"
})

export type DeleteNotificationParams = Schema.Schema.Type<typeof DeleteNotificationParamsSchema>

// --- Get Notification Context Params ---

export const GetNotificationContextParamsSchema = Schema.Struct({
  objectId: NonEmptyString.annotations({
    description: "Object ID to get notification context for"
  }),
  objectClass: ObjectClassName.annotations({
    description: "Object class name (e.g., 'tracker.class.Issue')"
  })
}).annotations({
  title: "GetNotificationContextParams",
  description: "Parameters for getting notification context for an entity"
})

export type GetNotificationContextParams = Schema.Schema.Type<typeof GetNotificationContextParamsSchema>

// --- List Notification Contexts Params ---

export const ListNotificationContextsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of contexts to return (default: 50)"
    })
  ),
  pinnedOnly: Schema.optional(
    Schema.Boolean.annotations({
      description: "Return only pinned contexts (default: false)"
    })
  )
}).annotations({
  title: "ListNotificationContextsParams",
  description: "Parameters for listing notification contexts"
})

export type ListNotificationContextsParams = Schema.Schema.Type<typeof ListNotificationContextsParamsSchema>

// --- Pin/Unpin Context Params ---

export const PinNotificationContextParamsSchema = Schema.Struct({
  contextId: NotificationContextId.annotations({
    description: "Notification context ID to pin/unpin"
  }),
  pinned: Schema.Boolean.annotations({
    description: "Whether to pin (true) or unpin (false) the context"
  })
}).annotations({
  title: "PinNotificationContextParams",
  description: "Parameters for pinning/unpinning a notification context"
})

export type PinNotificationContextParams = Schema.Schema.Type<typeof PinNotificationContextParamsSchema>

// --- List Notification Settings Params ---

export const ListNotificationSettingsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of settings to return (default: 50)"
    })
  )
}).annotations({
  title: "ListNotificationSettingsParams",
  description: "Parameters for listing notification settings"
})

export type ListNotificationSettingsParams = Schema.Schema.Type<typeof ListNotificationSettingsParamsSchema>

// --- Update Notification Provider Setting Params ---

export const UpdateNotificationProviderSettingParamsSchema = Schema.Struct({
  providerId: NotificationProviderId.annotations({
    description: "Notification provider ID"
  }),
  enabled: Schema.Boolean.annotations({
    description: "Whether to enable or disable the provider"
  })
}).annotations({
  title: "UpdateNotificationProviderSettingParams",
  description: "Parameters for updating notification provider setting"
})

export type UpdateNotificationProviderSettingParams = Schema.Schema.Type<
  typeof UpdateNotificationProviderSettingParamsSchema
>

// --- JSON Schemas for MCP ---

export const listNotificationsParamsJsonSchema = JSONSchema.make(ListNotificationsParamsSchema)
export const getNotificationParamsJsonSchema = JSONSchema.make(GetNotificationParamsSchema)
export const markNotificationReadParamsJsonSchema = JSONSchema.make(MarkNotificationReadParamsSchema)
export const archiveNotificationParamsJsonSchema = JSONSchema.make(ArchiveNotificationParamsSchema)
export const deleteNotificationParamsJsonSchema = JSONSchema.make(DeleteNotificationParamsSchema)
export const getNotificationContextParamsJsonSchema = JSONSchema.make(GetNotificationContextParamsSchema)
export const listNotificationContextsParamsJsonSchema = JSONSchema.make(ListNotificationContextsParamsSchema)
export const pinNotificationContextParamsJsonSchema = JSONSchema.make(PinNotificationContextParamsSchema)
export const listNotificationSettingsParamsJsonSchema = JSONSchema.make(ListNotificationSettingsParamsSchema)
export const updateNotificationProviderSettingParamsJsonSchema = JSONSchema.make(
  UpdateNotificationProviderSettingParamsSchema
)

// --- Parsers ---

export const parseListNotificationsParams = Schema.decodeUnknown(ListNotificationsParamsSchema)
export const parseGetNotificationParams = Schema.decodeUnknown(GetNotificationParamsSchema)
export const parseMarkNotificationReadParams = Schema.decodeUnknown(MarkNotificationReadParamsSchema)
export const parseArchiveNotificationParams = Schema.decodeUnknown(ArchiveNotificationParamsSchema)
export const parseDeleteNotificationParams = Schema.decodeUnknown(DeleteNotificationParamsSchema)
export const parseGetNotificationContextParams = Schema.decodeUnknown(GetNotificationContextParamsSchema)
export const parseListNotificationContextsParams = Schema.decodeUnknown(ListNotificationContextsParamsSchema)
export const parsePinNotificationContextParams = Schema.decodeUnknown(PinNotificationContextParamsSchema)
export const parseListNotificationSettingsParams = Schema.decodeUnknown(ListNotificationSettingsParamsSchema)
export const parseUpdateNotificationProviderSettingParams = Schema.decodeUnknown(
  UpdateNotificationProviderSettingParamsSchema
)

// No codec needed — internal type, not used for runtime validation
export interface MarkNotificationReadResult {
  readonly id: NotificationId
  readonly marked: boolean
}

export interface MarkAllNotificationsReadResult {
  readonly count: number
}

export interface ArchiveNotificationResult {
  readonly id: NotificationId
  readonly archived: boolean
}

export interface ArchiveAllNotificationsResult {
  readonly count: number
}

export interface DeleteNotificationResult {
  readonly id: NotificationId
  readonly deleted: boolean
}

export interface PinNotificationContextResult {
  readonly id: NotificationContextId
  readonly isPinned: boolean
}

export interface UpdateNotificationProviderSettingResult {
  readonly providerId: NotificationProviderId
  readonly enabled: boolean
  readonly updated: boolean
}

export interface UnreadCountResult {
  readonly count: number
}
