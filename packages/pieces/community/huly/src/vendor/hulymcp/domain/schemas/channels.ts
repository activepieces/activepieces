import { JSONSchema, Schema } from "effect"

import type { AccountUuid, ChannelId, ChannelName, PersonName } from "./shared.js"
import { ChannelIdentifier, LimitParam, MessageId, NonEmptyString, ThreadReplyId } from "./shared.js"

// No codec needed — internal type, not used for runtime validation
export interface ChannelSummary {
  readonly id: ChannelId
  readonly name: ChannelName
  readonly topic?: string | undefined
  readonly private: boolean
  readonly archived: boolean
  readonly members?: number | undefined
  readonly messages?: number | undefined
  readonly modifiedOn?: number | undefined
}

export interface Channel {
  readonly id: ChannelId
  readonly name: ChannelName
  readonly topic?: string | undefined
  readonly description?: string | undefined
  readonly private: boolean
  readonly archived: boolean
  readonly members?: ReadonlyArray<PersonName> | undefined
  readonly messages?: number | undefined
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export interface MessageSummary {
  readonly id: MessageId
  readonly body: string
  readonly sender?: PersonName | undefined
  readonly senderId?: string | undefined
  readonly createdOn?: number | undefined
  readonly modifiedOn?: number | undefined
  readonly editedOn?: number | undefined
  readonly replies?: number | undefined
}

export interface DirectMessageSummary {
  readonly id: ChannelId
  readonly participants: ReadonlyArray<PersonName>
  readonly participantIds?: ReadonlyArray<AccountUuid> | undefined
  readonly messages?: number | undefined
  readonly modifiedOn?: number | undefined
}

// --- List Channels Params ---

const ListChannelsParamsBase = Schema.Struct({
  nameSearch: Schema.optional(Schema.String.annotations({
    description: "Search channels by name substring (case-insensitive). Mutually exclusive with nameRegex."
  })),
  nameRegex: Schema.optional(Schema.String.annotations({
    description:
      "Filter channels by name using a regex pattern (e.g., '^dev-'). Mutually exclusive with nameSearch. Note: regex support depends on the Huly backend; use nameSearch for broader compatibility."
  })),
  topicSearch: Schema.optional(Schema.String.annotations({
    description: "Search channels by topic substring (case-insensitive)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of channels to return (default: 50)"
    })
  ),
  includeArchived: Schema.optional(
    Schema.Boolean.annotations({
      description: "Include archived channels in results (default: false)"
    })
  )
})

export const ListChannelsParamsSchema = ListChannelsParamsBase.pipe(
  Schema.filter((params) => {
    if (params.nameSearch !== undefined && params.nameRegex !== undefined) {
      return "Cannot provide both 'nameSearch' and 'nameRegex'. Use one or the other."
    }
    return undefined
  })
).annotations({
  title: "ListChannelsParams",
  description: "Parameters for listing channels"
})

export type ListChannelsParams = Schema.Schema.Type<typeof ListChannelsParamsSchema>

// --- Get Channel Params ---

export const GetChannelParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  })
}).annotations({
  title: "GetChannelParams",
  description: "Parameters for getting a single channel"
})

export type GetChannelParams = Schema.Schema.Type<typeof GetChannelParamsSchema>

// --- Create Channel Params ---

export const CreateChannelParamsSchema = Schema.Struct({
  name: NonEmptyString.annotations({
    description: "Channel name"
  }),
  topic: Schema.optional(Schema.String.annotations({
    description: "Channel topic/description"
  })),
  private: Schema.optional(Schema.Boolean.annotations({
    description: "Whether channel is private (default: false)"
  }))
}).annotations({
  title: "CreateChannelParams",
  description: "Parameters for creating a channel"
})

export type CreateChannelParams = Schema.Schema.Type<typeof CreateChannelParamsSchema>

// --- Update Channel Params ---

export const UpdateChannelParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  name: Schema.optional(NonEmptyString.annotations({
    description: "New channel name"
  })),
  topic: Schema.optional(Schema.String.annotations({
    description: "New channel topic"
  }))
}).annotations({
  title: "UpdateChannelParams",
  description: "Parameters for updating a channel"
})

export type UpdateChannelParams = Schema.Schema.Type<typeof UpdateChannelParamsSchema>

// --- Delete Channel Params ---

export const DeleteChannelParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  })
}).annotations({
  title: "DeleteChannelParams",
  description: "Parameters for deleting a channel"
})

export type DeleteChannelParams = Schema.Schema.Type<typeof DeleteChannelParamsSchema>

// --- List Channel Messages Params ---

export const ListChannelMessagesParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of messages to return (default: 50)"
    })
  )
}).annotations({
  title: "ListChannelMessagesParams",
  description: "Parameters for listing messages in a channel"
})

export type ListChannelMessagesParams = Schema.Schema.Type<typeof ListChannelMessagesParamsSchema>

// --- Send Channel Message Params ---

export const SendChannelMessageParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  body: NonEmptyString.annotations({
    description: "Message body (markdown supported)"
  })
}).annotations({
  title: "SendChannelMessageParams",
  description: "Parameters for sending a message to a channel"
})

export type SendChannelMessageParams = Schema.Schema.Type<typeof SendChannelMessageParamsSchema>

// --- List Direct Messages Params ---

export const ListDirectMessagesParamsSchema = Schema.Struct({
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of DM conversations to return (default: 50)"
    })
  )
}).annotations({
  title: "ListDirectMessagesParams",
  description: "Parameters for listing direct message conversations"
})

export type ListDirectMessagesParams = Schema.Schema.Type<typeof ListDirectMessagesParamsSchema>

// No codec needed — internal type, not used for runtime validation
export interface ThreadMessage {
  readonly id: ThreadReplyId
  readonly body: string
  readonly sender?: PersonName | undefined
  readonly senderId?: string | undefined
  readonly createdOn?: number | undefined
  readonly modifiedOn?: number | undefined
  readonly editedOn?: number | undefined
}

// --- List Thread Replies Params ---

export const ListThreadRepliesParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  messageId: MessageId.annotations({
    description: "Parent message ID"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of replies to return (default: 50)"
    })
  )
}).annotations({
  title: "ListThreadRepliesParams",
  description: "Parameters for listing thread replies"
})

export type ListThreadRepliesParams = Schema.Schema.Type<typeof ListThreadRepliesParamsSchema>

// --- Add Thread Reply Params ---

export const AddThreadReplyParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  messageId: MessageId.annotations({
    description: "Parent message ID to reply to"
  }),
  body: NonEmptyString.annotations({
    description: "Reply body (markdown supported)"
  })
}).annotations({
  title: "AddThreadReplyParams",
  description: "Parameters for adding a thread reply"
})

export type AddThreadReplyParams = Schema.Schema.Type<typeof AddThreadReplyParamsSchema>

// --- Update Thread Reply Params ---

export const UpdateThreadReplyParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  messageId: MessageId.annotations({
    description: "Parent message ID"
  }),
  replyId: ThreadReplyId.annotations({
    description: "Thread reply ID to update"
  }),
  body: NonEmptyString.annotations({
    description: "New reply body (markdown supported)"
  })
}).annotations({
  title: "UpdateThreadReplyParams",
  description: "Parameters for updating a thread reply"
})

export type UpdateThreadReplyParams = Schema.Schema.Type<typeof UpdateThreadReplyParamsSchema>

// --- Delete Thread Reply Params ---

export const DeleteThreadReplyParamsSchema = Schema.Struct({
  channel: ChannelIdentifier.annotations({
    description: "Channel name or ID"
  }),
  messageId: MessageId.annotations({
    description: "Parent message ID"
  }),
  replyId: ThreadReplyId.annotations({
    description: "Thread reply ID to delete"
  })
}).annotations({
  title: "DeleteThreadReplyParams",
  description: "Parameters for deleting a thread reply"
})

export type DeleteThreadReplyParams = Schema.Schema.Type<typeof DeleteThreadReplyParamsSchema>

// --- JSON Schemas for MCP ---

export const listChannelsParamsJsonSchema = JSONSchema.make(ListChannelsParamsSchema)
export const getChannelParamsJsonSchema = JSONSchema.make(GetChannelParamsSchema)
export const createChannelParamsJsonSchema = JSONSchema.make(CreateChannelParamsSchema)
export const updateChannelParamsJsonSchema = JSONSchema.make(UpdateChannelParamsSchema)
export const deleteChannelParamsJsonSchema = JSONSchema.make(DeleteChannelParamsSchema)
export const listChannelMessagesParamsJsonSchema = JSONSchema.make(ListChannelMessagesParamsSchema)
export const sendChannelMessageParamsJsonSchema = JSONSchema.make(SendChannelMessageParamsSchema)
export const listDirectMessagesParamsJsonSchema = JSONSchema.make(ListDirectMessagesParamsSchema)
export const listThreadRepliesParamsJsonSchema = JSONSchema.make(ListThreadRepliesParamsSchema)
export const addThreadReplyParamsJsonSchema = JSONSchema.make(AddThreadReplyParamsSchema)
export const updateThreadReplyParamsJsonSchema = JSONSchema.make(UpdateThreadReplyParamsSchema)
export const deleteThreadReplyParamsJsonSchema = JSONSchema.make(DeleteThreadReplyParamsSchema)

// --- Parsers ---

export const parseListChannelsParams = Schema.decodeUnknown(ListChannelsParamsSchema)
export const parseGetChannelParams = Schema.decodeUnknown(GetChannelParamsSchema)
export const parseCreateChannelParams = Schema.decodeUnknown(CreateChannelParamsSchema)
export const parseUpdateChannelParams = Schema.decodeUnknown(UpdateChannelParamsSchema)
export const parseDeleteChannelParams = Schema.decodeUnknown(DeleteChannelParamsSchema)
export const parseListChannelMessagesParams = Schema.decodeUnknown(ListChannelMessagesParamsSchema)
export const parseSendChannelMessageParams = Schema.decodeUnknown(SendChannelMessageParamsSchema)
export const parseListDirectMessagesParams = Schema.decodeUnknown(ListDirectMessagesParamsSchema)
export const parseListThreadRepliesParams = Schema.decodeUnknown(ListThreadRepliesParamsSchema)
export const parseAddThreadReplyParams = Schema.decodeUnknown(AddThreadReplyParamsSchema)
export const parseUpdateThreadReplyParams = Schema.decodeUnknown(UpdateThreadReplyParamsSchema)
export const parseDeleteThreadReplyParams = Schema.decodeUnknown(DeleteThreadReplyParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface CreateChannelResult {
  readonly id: ChannelId
  readonly name: ChannelName
}

export interface UpdateChannelResult {
  readonly id: ChannelId
  readonly updated: boolean
}

export interface DeleteChannelResult {
  readonly id: ChannelId
  readonly deleted: boolean
}

export interface ListChannelMessagesResult {
  readonly messages: ReadonlyArray<MessageSummary>
  readonly total: number
}

export interface SendChannelMessageResult {
  readonly id: MessageId
  readonly channelId: ChannelId
}

export interface ListDirectMessagesResult {
  readonly conversations: ReadonlyArray<DirectMessageSummary>
  readonly total: number
}

export interface ListThreadRepliesResult {
  readonly replies: ReadonlyArray<ThreadMessage>
  readonly total: number
}

export interface AddThreadReplyResult {
  readonly id: ThreadReplyId
  readonly messageId: MessageId
  readonly channelId: ChannelId
}

export interface UpdateThreadReplyResult {
  readonly id: ThreadReplyId
  readonly updated: boolean
}

export interface DeleteThreadReplyResult {
  readonly id: ThreadReplyId
  readonly deleted: boolean
}
