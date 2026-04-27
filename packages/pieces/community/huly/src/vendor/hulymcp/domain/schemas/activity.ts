import { JSONSchema, Schema } from "effect"

import { ActivityMessageId, EmojiCode, LimitParam, NonEmptyString, ObjectClassName } from "./shared.js"

// No codec needed — internal type, not used for runtime validation
export interface ActivityMessage {
  readonly id: ActivityMessageId
  readonly objectId: string
  readonly objectClass: ObjectClassName
  readonly modifiedBy?: string | undefined
  readonly modifiedOn?: number | undefined
  readonly isPinned?: boolean | undefined
  readonly replies?: number | undefined
  readonly reactions?: number | undefined
  readonly editedOn?: number | null | undefined
  readonly action?: string | undefined
  readonly message?: string | undefined
}

export interface Reaction {
  readonly id: string
  readonly messageId: ActivityMessageId
  readonly emoji: EmojiCode
  readonly createdBy?: string | undefined
}

export interface SavedMessage {
  readonly id: string
  readonly messageId: ActivityMessageId
}

export interface Mention {
  readonly id: string
  readonly messageId: ActivityMessageId
  readonly userId: string
  readonly content?: string | undefined
}

export const ListActivityParamsSchema = Schema.Struct({
  objectId: NonEmptyString.annotations({
    description: "ID of the object to get activity for"
  }),
  objectClass: ObjectClassName.annotations({
    description: "Class of the object (e.g., 'tracker:class:Issue')"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of activity messages to return (default: 50)"
    })
  )
}).annotations({
  title: "ListActivityParams",
  description: "Parameters for listing activity on an object"
})

export type ListActivityParams = Schema.Schema.Type<typeof ListActivityParamsSchema>

export const AddReactionParamsSchema = Schema.Struct({
  messageId: ActivityMessageId.annotations({
    description: "ID of the activity message to react to"
  }),
  emoji: EmojiCode.annotations({
    description: "Emoji to add (e.g., ':thumbsup:', ':heart:', or unicode emoji)"
  })
}).annotations({
  title: "AddReactionParams",
  description: "Parameters for adding a reaction to a message"
})

export type AddReactionParams = Schema.Schema.Type<typeof AddReactionParamsSchema>

export const RemoveReactionParamsSchema = Schema.Struct({
  messageId: ActivityMessageId.annotations({
    description: "ID of the activity message"
  }),
  emoji: EmojiCode.annotations({
    description: "Emoji to remove"
  })
}).annotations({
  title: "RemoveReactionParams",
  description: "Parameters for removing a reaction from a message"
})

export type RemoveReactionParams = Schema.Schema.Type<typeof RemoveReactionParamsSchema>

export const ListReactionsParamsSchema = Schema.Struct({
  messageId: ActivityMessageId.annotations({
    description: "ID of the activity message to list reactions for"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of reactions to return (default: 50)"
    })
  )
}).annotations({
  title: "ListReactionsParams",
  description: "Parameters for listing reactions on a message"
})

export type ListReactionsParams = Schema.Schema.Type<typeof ListReactionsParamsSchema>

export const SaveMessageParamsSchema = Schema.Struct({
  messageId: ActivityMessageId.annotations({
    description: "ID of the activity message to save/bookmark"
  })
}).annotations({
  title: "SaveMessageParams",
  description: "Parameters for saving/bookmarking a message"
})

export type SaveMessageParams = Schema.Schema.Type<typeof SaveMessageParamsSchema>

export const UnsaveMessageParamsSchema = Schema.Struct({
  messageId: ActivityMessageId.annotations({
    description: "ID of the saved activity message to remove from bookmarks"
  })
}).annotations({
  title: "UnsaveMessageParams",
  description: "Parameters for removing a message from bookmarks"
})

export type UnsaveMessageParams = Schema.Schema.Type<typeof UnsaveMessageParamsSchema>

export const ListSavedMessagesParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of saved messages to return (default: 50)"
    })
  )
}).annotations({
  title: "ListSavedMessagesParams",
  description: "Parameters for listing saved/bookmarked messages"
})

export type ListSavedMessagesParams = Schema.Schema.Type<typeof ListSavedMessagesParamsSchema>

export const ListMentionsParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of mentions to return (default: 50)"
    })
  )
}).annotations({
  title: "ListMentionsParams",
  description: "Parameters for listing mentions of the current user"
})

export type ListMentionsParams = Schema.Schema.Type<typeof ListMentionsParamsSchema>

export const listActivityParamsJsonSchema = JSONSchema.make(ListActivityParamsSchema)
export const addReactionParamsJsonSchema = JSONSchema.make(AddReactionParamsSchema)
export const removeReactionParamsJsonSchema = JSONSchema.make(RemoveReactionParamsSchema)
export const listReactionsParamsJsonSchema = JSONSchema.make(ListReactionsParamsSchema)
export const saveMessageParamsJsonSchema = JSONSchema.make(SaveMessageParamsSchema)
export const unsaveMessageParamsJsonSchema = JSONSchema.make(UnsaveMessageParamsSchema)
export const listSavedMessagesParamsJsonSchema = JSONSchema.make(ListSavedMessagesParamsSchema)
export const listMentionsParamsJsonSchema = JSONSchema.make(ListMentionsParamsSchema)

export const parseListActivityParams = Schema.decodeUnknown(ListActivityParamsSchema)
export const parseAddReactionParams = Schema.decodeUnknown(AddReactionParamsSchema)
export const parseRemoveReactionParams = Schema.decodeUnknown(RemoveReactionParamsSchema)
export const parseListReactionsParams = Schema.decodeUnknown(ListReactionsParamsSchema)
export const parseSaveMessageParams = Schema.decodeUnknown(SaveMessageParamsSchema)
export const parseUnsaveMessageParams = Schema.decodeUnknown(UnsaveMessageParamsSchema)
export const parseListSavedMessagesParams = Schema.decodeUnknown(ListSavedMessagesParamsSchema)
export const parseListMentionsParams = Schema.decodeUnknown(ListMentionsParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface AddReactionResult {
  readonly reactionId: string
  readonly messageId: ActivityMessageId
}

export interface RemoveReactionResult {
  readonly messageId: ActivityMessageId
  readonly removed: boolean
}

export interface SaveMessageResult {
  readonly savedId: string
  readonly messageId: ActivityMessageId
}

export interface UnsaveMessageResult {
  readonly messageId: ActivityMessageId
  readonly removed: boolean
}
