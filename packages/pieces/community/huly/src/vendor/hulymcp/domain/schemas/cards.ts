import { JSONSchema, Schema } from "effect"

import type { CardId, CardSpaceId, MasterTagId } from "./shared.js"
import { CardIdentifier, CardSpaceIdentifier, LimitParam, MasterTagIdentifier, NonEmptyString } from "./shared.js"

export interface CardSpaceSummary {
  readonly id: CardSpaceId
  readonly name: string
  readonly description?: string | undefined
  readonly types: ReadonlyArray<string>
}

export const ListCardSpacesParamsSchema = Schema.Struct({
  includeArchived: Schema.optional(Schema.Boolean.annotations({
    description: "Include archived card spaces in results (default: false, showing only active)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of card spaces to return (default: 50)"
    })
  )
}).annotations({
  title: "ListCardSpacesParams",
  description: "Parameters for listing card spaces"
})

export type ListCardSpacesParams = Schema.Schema.Type<typeof ListCardSpacesParamsSchema>

export interface ListCardSpacesResult {
  readonly cardSpaces: ReadonlyArray<CardSpaceSummary>
  readonly total: number
}

export interface MasterTagSummary {
  readonly id: MasterTagId
  readonly name: string
}

export const ListMasterTagsParamsSchema = Schema.Struct({
  cardSpace: CardSpaceIdentifier.annotations({
    description: "Card space name or ID"
  })
}).annotations({
  title: "ListMasterTagsParams",
  description: "Parameters for listing master tags (card types) available in a card space"
})

export type ListMasterTagsParams = Schema.Schema.Type<typeof ListMasterTagsParamsSchema>

export interface ListMasterTagsResult {
  readonly masterTags: ReadonlyArray<MasterTagSummary>
  readonly total: number
}

export interface CardSummary {
  readonly id: CardId
  readonly title: string
  readonly type: string
  readonly modifiedOn?: number | undefined
}

const ListCardsParamsBase = Schema.Struct({
  cardSpace: CardSpaceIdentifier.annotations({
    description: "Card space name or ID"
  }),
  type: Schema.optional(MasterTagIdentifier.annotations({
    description: "Filter by master tag (card type) name or ID"
  })),
  titleSearch: Schema.optional(Schema.String.annotations({
    description: "Search cards by title substring (case-insensitive). Mutually exclusive with titleRegex."
  })),
  titleRegex: Schema.optional(Schema.String.annotations({
    description:
      "Filter cards by title using a regex pattern (e.g., '^TODO'). Mutually exclusive with titleSearch. Note: regex support depends on the Huly backend; use titleSearch for broader compatibility."
  })),
  contentSearch: Schema.optional(Schema.String.annotations({
    description: "Search cards by content (fulltext search)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of cards to return (default: 50)"
    })
  )
})

export const ListCardsParamsSchema = ListCardsParamsBase.pipe(
  Schema.filter((params) => {
    if (params.titleSearch !== undefined && params.titleRegex !== undefined) {
      return "Cannot provide both 'titleSearch' and 'titleRegex'. Use one or the other."
    }
    return undefined
  })
).annotations({
  title: "ListCardsParams",
  description: "Parameters for listing cards in a card space"
})

export type ListCardsParams = Schema.Schema.Type<typeof ListCardsParamsSchema>

export interface ListCardsResult {
  readonly cards: ReadonlyArray<CardSummary>
  readonly total: number
}

export interface CardDetail {
  readonly id: CardId
  readonly title: string
  readonly content?: string | undefined
  readonly type: string
  readonly parent?: string | undefined
  readonly children?: number | undefined
  readonly cardSpace: string
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export const GetCardParamsSchema = Schema.Struct({
  cardSpace: CardSpaceIdentifier.annotations({
    description: "Card space name or ID"
  }),
  card: CardIdentifier.annotations({
    description: "Card title or ID"
  })
}).annotations({
  title: "GetCardParams",
  description: "Parameters for getting a single card"
})

export type GetCardParams = Schema.Schema.Type<typeof GetCardParamsSchema>

export const CreateCardParamsSchema = Schema.Struct({
  cardSpace: CardSpaceIdentifier.annotations({
    description: "Card space name or ID"
  }),
  type: MasterTagIdentifier.annotations({
    description: "Master tag (card type) name or ID"
  }),
  title: NonEmptyString.annotations({
    description: "Card title"
  }),
  content: Schema.optional(Schema.String.annotations({
    description: "Card content (markdown supported)"
  })),
  parent: Schema.optional(CardIdentifier.annotations({
    description: "Parent card title or ID (for creating child cards)"
  }))
}).annotations({
  title: "CreateCardParams",
  description: "Parameters for creating a card"
})

export type CreateCardParams = Schema.Schema.Type<typeof CreateCardParamsSchema>

export const UpdateCardParamsSchema = Schema.Struct({
  cardSpace: CardSpaceIdentifier.annotations({
    description: "Card space name or ID"
  }),
  card: CardIdentifier.annotations({
    description: "Card title or ID"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "New card title"
  })),
  content: Schema.optional(Schema.String.annotations({
    description: "New card content (markdown supported)"
  }))
}).annotations({
  title: "UpdateCardParams",
  description: "Parameters for updating a card"
})

export type UpdateCardParams = Schema.Schema.Type<typeof UpdateCardParamsSchema>

export const DeleteCardParamsSchema = Schema.Struct({
  cardSpace: CardSpaceIdentifier.annotations({
    description: "Card space name or ID"
  }),
  card: CardIdentifier.annotations({
    description: "Card title or ID"
  })
}).annotations({
  title: "DeleteCardParams",
  description: "Parameters for deleting a card"
})

export type DeleteCardParams = Schema.Schema.Type<typeof DeleteCardParamsSchema>

export const listCardSpacesParamsJsonSchema = JSONSchema.make(ListCardSpacesParamsSchema)
export const listMasterTagsParamsJsonSchema = JSONSchema.make(ListMasterTagsParamsSchema)
export const listCardsParamsJsonSchema = JSONSchema.make(ListCardsParamsSchema)
export const getCardParamsJsonSchema = JSONSchema.make(GetCardParamsSchema)
export const createCardParamsJsonSchema = JSONSchema.make(CreateCardParamsSchema)
export const updateCardParamsJsonSchema = JSONSchema.make(UpdateCardParamsSchema)
export const deleteCardParamsJsonSchema = JSONSchema.make(DeleteCardParamsSchema)

export const parseListCardSpacesParams = Schema.decodeUnknown(ListCardSpacesParamsSchema)
export const parseListMasterTagsParams = Schema.decodeUnknown(ListMasterTagsParamsSchema)
export const parseListCardsParams = Schema.decodeUnknown(ListCardsParamsSchema)
export const parseGetCardParams = Schema.decodeUnknown(GetCardParamsSchema)
export const parseCreateCardParams = Schema.decodeUnknown(CreateCardParamsSchema)
export const parseUpdateCardParams = Schema.decodeUnknown(UpdateCardParamsSchema)
export const parseDeleteCardParams = Schema.decodeUnknown(DeleteCardParamsSchema)

export interface CreateCardResult {
  readonly id: CardId
  readonly title: string
}

export interface UpdateCardResult {
  readonly id: CardId
  readonly updated: boolean
}

export interface DeleteCardResult {
  readonly id: CardId
  readonly deleted: boolean
}
