import type { Class, Doc, DocumentQuery, DocumentUpdate } from "@hcengineering/core"
import { SortingOrder } from "@hcengineering/core"
import type {
  DocNotifyContext as HulyDocNotifyContext,
  InboxNotification as HulyInboxNotification,
  NotificationProvider,
  NotificationProviderSetting as HulyNotificationProviderSetting
} from "@hcengineering/notification"
import { Effect } from "effect"

import type {
  ArchiveNotificationParams,
  DeleteNotificationParams,
  DocNotifyContextSummary,
  GetNotificationContextParams,
  GetNotificationParams,
  ListNotificationContextsParams,
  ListNotificationSettingsParams,
  ListNotificationsParams,
  MarkNotificationReadParams,
  Notification,
  NotificationProviderSetting,
  NotificationSummary,
  PinNotificationContextParams,
  UpdateNotificationProviderSettingParams
} from "../../domain/schemas.js"
import type {
  ArchiveAllNotificationsResult,
  ArchiveNotificationResult,
  DeleteNotificationResult,
  MarkAllNotificationsReadResult,
  MarkNotificationReadResult,
  PinNotificationContextResult,
  UnreadCountResult,
  UpdateNotificationProviderSettingResult
} from "../../domain/schemas/notifications.js"
import {
  NotificationContextId,
  NotificationId,
  NotificationProviderId,
  ObjectClassName
} from "../../domain/schemas/shared.js"
import { HulyClient, type HulyClientError } from "../client.js"
import { NotificationContextNotFoundError, NotificationNotFoundError } from "../errors.js"
import { clampLimit, findOneOrFail, toRef } from "./shared.js"

import { notification } from "../huly-plugins.js"

const toDocNotifyContextSummary = (ctx: HulyDocNotifyContext): DocNotifyContextSummary => ({
  id: NotificationContextId.make(ctx._id),
  objectId: ctx.objectId,
  objectClass: ObjectClassName.make(ctx.objectClass),
  isPinned: ctx.isPinned,
  hidden: ctx.hidden,
  lastViewedTimestamp: ctx.lastViewedTimestamp,
  lastUpdateTimestamp: ctx.lastUpdateTimestamp
})

// --- Error Types ---

type ListNotificationsError = HulyClientError

type GetNotificationError =
  | HulyClientError
  | NotificationNotFoundError

type MarkNotificationReadError =
  | HulyClientError
  | NotificationNotFoundError

type ArchiveNotificationError =
  | HulyClientError
  | NotificationNotFoundError

type DeleteNotificationError =
  | HulyClientError
  | NotificationNotFoundError

type GetNotificationContextError =
  | HulyClientError
  | NotificationContextNotFoundError

type ListNotificationContextsError = HulyClientError

type PinNotificationContextError =
  | HulyClientError
  | NotificationContextNotFoundError

type ListNotificationSettingsError = HulyClientError

type UpdateNotificationProviderSettingError = HulyClientError

type MarkAllNotificationsReadError = HulyClientError

type ArchiveAllNotificationsError = HulyClientError

// --- Helpers ---

const findNotification = (
  notificationId: string
): Effect.Effect<
  { client: HulyClient["Type"]; notification: HulyInboxNotification },
  NotificationNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const notif = yield* findOneOrFail(
      client,
      notification.class.InboxNotification,
      { _id: toRef<HulyInboxNotification>(notificationId) },
      () => new NotificationNotFoundError({ notificationId })
    )

    return { client, notification: notif }
  })

const findNotificationContext = (
  contextId: string
): Effect.Effect<
  { client: HulyClient["Type"]; context: HulyDocNotifyContext },
  NotificationContextNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const ctx = yield* findOneOrFail(
      client,
      notification.class.DocNotifyContext,
      { _id: toRef<HulyDocNotifyContext>(contextId) },
      () => new NotificationContextNotFoundError({ contextId })
    )

    return { client, context: ctx }
  })

// --- Operations ---

/**
 * List inbox notifications.
 * Results sorted by modification date descending (newest first).
 */
export const listNotifications = (
  params: ListNotificationsParams
): Effect.Effect<Array<NotificationSummary>, ListNotificationsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const query: DocumentQuery<HulyInboxNotification> = {}

    if (!params.includeArchived) {
      query.archived = false
    }

    if (params.unreadOnly) {
      query.isViewed = false
    }

    const limit = clampLimit(params.limit)

    const notifications = yield* client.findAll<HulyInboxNotification>(
      notification.class.InboxNotification,
      query,
      {
        limit,
        sort: {
          modifiedOn: SortingOrder.Descending
        }
      }
    )

    const summaries: Array<NotificationSummary> = notifications.map((n) => ({
      id: NotificationId.make(n._id),
      isViewed: n.isViewed,
      archived: n.archived,
      objectId: n.objectId,
      objectClass: ObjectClassName.make(n.objectClass),
      title: n.title,
      body: n.body,
      createdOn: n.createdOn,
      modifiedOn: n.modifiedOn
    }))

    return summaries
  })

/**
 * Get a single notification with full details.
 */
export const getNotification = (
  params: GetNotificationParams
): Effect.Effect<Notification, GetNotificationError, HulyClient> =>
  Effect.gen(function*() {
    const { notification: notif } = yield* findNotification(params.notificationId)

    const result: Notification = {
      id: NotificationId.make(notif._id),
      isViewed: notif.isViewed,
      archived: notif.archived,
      objectId: notif.objectId,
      objectClass: ObjectClassName.make(notif.objectClass),
      docNotifyContextId: NotificationContextId.make(notif.docNotifyContext),
      title: notif.title,
      body: notif.body,
      data: notif.data ? notif.data : undefined,
      createdOn: notif.createdOn,
      modifiedOn: notif.modifiedOn
    }

    return result
  })

/**
 * Mark a notification as read.
 */
export const markNotificationRead = (
  params: MarkNotificationReadParams
): Effect.Effect<MarkNotificationReadResult, MarkNotificationReadError, HulyClient> =>
  Effect.gen(function*() {
    const { client, notification: notif } = yield* findNotification(params.notificationId)

    if (notif.isViewed) {
      return { id: NotificationId.make(notif._id), marked: true }
    }

    const updateOps: DocumentUpdate<HulyInboxNotification> = {
      isViewed: true
    }

    yield* client.updateDoc(
      notification.class.InboxNotification,
      notif.space,
      notif._id,
      updateOps
    )

    return { id: NotificationId.make(notif._id), marked: true }
  })

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsRead = (): Effect.Effect<
  MarkAllNotificationsReadResult,
  MarkAllNotificationsReadError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const unreadNotifications = yield* client.findAll<HulyInboxNotification>(
      notification.class.InboxNotification,
      { isViewed: false, archived: false },
      { limit: 200 }
    )

    // Concurrent updates (10x speedup). Limited to 200/call.
    yield* Effect.forEach(
      unreadNotifications,
      (notif) =>
        client.updateDoc(
          notification.class.InboxNotification,
          notif.space,
          notif._id,
          { isViewed: true }
        ),
      { concurrency: 10 }
    )

    return { count: unreadNotifications.length }
  })

/**
 * Archive a notification.
 */
export const archiveNotification = (
  params: ArchiveNotificationParams
): Effect.Effect<ArchiveNotificationResult, ArchiveNotificationError, HulyClient> =>
  Effect.gen(function*() {
    const { client, notification: notif } = yield* findNotification(params.notificationId)

    if (notif.archived) {
      return { id: NotificationId.make(notif._id), archived: true }
    }

    const updateOps: DocumentUpdate<HulyInboxNotification> = {
      archived: true
    }

    yield* client.updateDoc(
      notification.class.InboxNotification,
      notif.space,
      notif._id,
      updateOps
    )

    return { id: NotificationId.make(notif._id), archived: true }
  })

/**
 * Archive all notifications.
 */
export const archiveAllNotifications = (): Effect.Effect<
  ArchiveAllNotificationsResult,
  ArchiveAllNotificationsError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const activeNotifications = yield* client.findAll<HulyInboxNotification>(
      notification.class.InboxNotification,
      { archived: false },
      { limit: 200 }
    )

    // Concurrent updates (10x speedup). Limited to 200/call.
    yield* Effect.forEach(
      activeNotifications,
      (notif) =>
        client.updateDoc(
          notification.class.InboxNotification,
          notif.space,
          notif._id,
          { archived: true }
        ),
      { concurrency: 10 }
    )

    return { count: activeNotifications.length }
  })

/**
 * Delete a notification.
 */
export const deleteNotification = (
  params: DeleteNotificationParams
): Effect.Effect<DeleteNotificationResult, DeleteNotificationError, HulyClient> =>
  Effect.gen(function*() {
    const { client, notification: notif } = yield* findNotification(params.notificationId)

    yield* client.removeDoc(
      notification.class.InboxNotification,
      notif.space,
      notif._id
    )

    return { id: NotificationId.make(notif._id), deleted: true }
  })

/**
 * Get notification context for an entity.
 */
export const getNotificationContext = (
  params: GetNotificationContextParams
): Effect.Effect<DocNotifyContextSummary | null, GetNotificationContextError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const ctx = yield* client.findOne<HulyDocNotifyContext>(
      notification.class.DocNotifyContext,
      {
        objectId: toRef<Doc>(params.objectId),
        objectClass: toRef<Class<Doc>>(params.objectClass)
      }
    )

    if (ctx === undefined) {
      return null
    }

    return toDocNotifyContextSummary(ctx)
  })

/**
 * List notification contexts.
 * Results sorted by last update timestamp descending (newest first).
 */
export const listNotificationContexts = (
  params: ListNotificationContextsParams
): Effect.Effect<Array<DocNotifyContextSummary>, ListNotificationContextsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const query: DocumentQuery<HulyDocNotifyContext> = {
      hidden: false
    }

    if (params.pinnedOnly) {
      query.isPinned = true
    }

    const limit = clampLimit(params.limit)

    const contexts = yield* client.findAll<HulyDocNotifyContext>(
      notification.class.DocNotifyContext,
      query,
      {
        limit,
        sort: {
          lastUpdateTimestamp: SortingOrder.Descending
        }
      }
    )

    return contexts.map(toDocNotifyContextSummary)
  })

/**
 * Pin or unpin a notification context.
 */
export const pinNotificationContext = (
  params: PinNotificationContextParams
): Effect.Effect<PinNotificationContextResult, PinNotificationContextError, HulyClient> =>
  Effect.gen(function*() {
    const { client, context } = yield* findNotificationContext(params.contextId)

    if (context.isPinned === params.pinned) {
      return { id: NotificationContextId.make(context._id), isPinned: context.isPinned }
    }

    const updateOps: DocumentUpdate<HulyDocNotifyContext> = {
      isPinned: params.pinned
    }

    yield* client.updateDoc(
      notification.class.DocNotifyContext,
      context.space,
      context._id,
      updateOps
    )

    return { id: NotificationContextId.make(context._id), isPinned: params.pinned }
  })

/**
 * List notification provider settings.
 */
export const listNotificationSettings = (
  params: ListNotificationSettingsParams
): Effect.Effect<Array<NotificationProviderSetting>, ListNotificationSettingsError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const limit = clampLimit(params.limit)

    const settings = yield* client.findAll<HulyNotificationProviderSetting>(
      notification.class.NotificationProviderSetting,
      {},
      { limit }
    )

    const summaries: Array<NotificationProviderSetting> = settings.map((s) => ({
      id: s._id,
      providerId: NotificationProviderId.make(s.attachedTo),
      enabled: s.enabled
    }))

    return summaries
  })

/**
 * Update notification provider setting.
 */
export const updateNotificationProviderSetting = (
  params: UpdateNotificationProviderSettingParams
): Effect.Effect<UpdateNotificationProviderSettingResult, UpdateNotificationProviderSettingError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const existingSetting = yield* client.findOne<HulyNotificationProviderSetting>(
      notification.class.NotificationProviderSetting,
      { attachedTo: toRef<NotificationProvider>(params.providerId) }
    )

    if (existingSetting !== undefined) {
      if (existingSetting.enabled === params.enabled) {
        return { providerId: NotificationProviderId.make(params.providerId), enabled: params.enabled, updated: false }
      }

      yield* client.updateDoc(
        notification.class.NotificationProviderSetting,
        existingSetting.space,
        existingSetting._id,
        { enabled: params.enabled }
      )

      return { providerId: NotificationProviderId.make(params.providerId), enabled: params.enabled, updated: true }
    }

    // Setting doesn't exist, we can't create it without a proper space
    // Return not updated since we can't modify what doesn't exist
    return { providerId: params.providerId, enabled: params.enabled, updated: false }
  })

/**
 * Get unread notification count.
 */
export const getUnreadNotificationCount = (): Effect.Effect<UnreadCountResult, HulyClientError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const unreadNotifications = yield* client.findAll<HulyInboxNotification>(
      notification.class.InboxNotification,
      { isViewed: false, archived: false },
      { limit: 1 }
    )

    const count = unreadNotifications.total

    return { count }
  })
