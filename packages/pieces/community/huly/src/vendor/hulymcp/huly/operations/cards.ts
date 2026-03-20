import type { Card as HulyCard, CardSpace as HulyCardSpace, MasterTag as HulyMasterTag } from "@hcengineering/card"
import {
  type Data,
  type DocumentQuery,
  type DocumentUpdate,
  generateId,
  type Ref,
  SortingOrder
} from "@hcengineering/core"
import { makeRank } from "@hcengineering/rank"
import { Effect } from "effect"

import type {
  CardDetail,
  CardSpaceSummary,
  CardSummary,
  CreateCardParams,
  CreateCardResult,
  DeleteCardParams,
  DeleteCardResult,
  GetCardParams,
  ListCardSpacesParams,
  ListCardSpacesResult,
  ListCardsParams,
  ListCardsResult,
  ListMasterTagsParams,
  ListMasterTagsResult,
  MasterTagSummary,
  UpdateCardParams,
  UpdateCardResult
} from "../../domain/schemas/cards.js"
import { CardId, CardSpaceId, MasterTagId } from "../../domain/schemas/shared.js"
import { HulyClient, type HulyClientError } from "../client.js"
import { CardNotFoundError, CardSpaceNotFoundError, MasterTagNotFoundError } from "../errors.js"
import { cardPlugin } from "../huly-plugins.js"
import { escapeLikeWildcards } from "./query-helpers.js"
import { clampLimit, findByNameOrId, toRef } from "./shared.js"

type ListCardSpacesError = HulyClientError

type ListMasterTagsError =
  | HulyClientError
  | CardSpaceNotFoundError

type ListCardsError =
  | HulyClientError
  | CardSpaceNotFoundError
  | MasterTagNotFoundError

type GetCardError =
  | HulyClientError
  | CardSpaceNotFoundError
  | CardNotFoundError

type CreateCardError =
  | HulyClientError
  | CardSpaceNotFoundError
  | MasterTagNotFoundError
  | CardNotFoundError

type UpdateCardError =
  | HulyClientError
  | CardSpaceNotFoundError
  | CardNotFoundError

type DeleteCardError =
  | HulyClientError
  | CardSpaceNotFoundError
  | CardNotFoundError

// --- Helpers ---

const findCardSpace = (
  identifier: string
): Effect.Effect<
  { cardSpace: HulyCardSpace; client: HulyClient["Type"] },
  CardSpaceNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const cardSpace = yield* findByNameOrId(
      client,
      cardPlugin.class.CardSpace,
      { name: identifier, archived: false },
      { _id: toRef<HulyCardSpace>(identifier) }
    )

    if (cardSpace === undefined) {
      return yield* new CardSpaceNotFoundError({ identifier })
    }

    return { cardSpace, client }
  })

const findCardSpaceAndCard = (
  params: { card: string; cardSpace: string }
): Effect.Effect<
  { card: HulyCard; cardSpace: HulyCardSpace; client: HulyClient["Type"] },
  CardSpaceNotFoundError | CardNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const { cardSpace, client } = yield* findCardSpace(params.cardSpace)

    const card = yield* findByNameOrId(
      client,
      cardPlugin.class.Card,
      { space: cardSpace._id, title: params.card },
      { space: cardSpace._id, _id: toRef<HulyCard>(params.card) }
    )

    if (card === undefined) {
      return yield* new CardNotFoundError({
        identifier: params.card,
        cardSpace: params.cardSpace
      })
    }

    return { card, cardSpace, client }
  })

const findMasterTag = (
  client: HulyClient["Type"],
  cardSpace: HulyCardSpace,
  identifier: string
): Effect.Effect<HulyMasterTag, MasterTagNotFoundError | HulyClientError> =>
  Effect.gen(function*() {
    const typeRefs = cardSpace.types
    if (typeRefs.length === 0) {
      return yield* new MasterTagNotFoundError({
        identifier,
        cardSpace: cardSpace.name
      })
    }

    const allTags = yield* client.findAll<HulyMasterTag>(
      cardPlugin.class.MasterTag,
      { _id: { $in: typeRefs } }
    )

    const byName = allTags.find((t) => t.label === identifier)
    if (byName !== undefined) return byName

    const byId = allTags.find((t) => t._id === identifier)
    if (byId !== undefined) return byId

    return yield* new MasterTagNotFoundError({
      identifier,
      cardSpace: cardSpace.name
    })
  })

// --- Operations ---

export const listCardSpaces = (
  params: ListCardSpacesParams
): Effect.Effect<ListCardSpacesResult, ListCardSpacesError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const query: DocumentQuery<HulyCardSpace> = {}
    if (!params.includeArchived) {
      query.archived = false
    }

    const limit = clampLimit(params.limit)

    const spaces = yield* client.findAll<HulyCardSpace>(
      cardPlugin.class.CardSpace,
      query,
      {
        limit,
        sort: {
          name: SortingOrder.Ascending
        }
      }
    )

    const summaries: Array<CardSpaceSummary> = spaces.map((s) => ({
      id: CardSpaceId.make(s._id),
      name: s.name,
      description: s.description || undefined,
      types: s.types.map(String)
    }))

    return {
      cardSpaces: summaries,
      total: spaces.total
    }
  })

export const listMasterTags = (
  params: ListMasterTagsParams
): Effect.Effect<ListMasterTagsResult, ListMasterTagsError, HulyClient> =>
  Effect.gen(function*() {
    const { cardSpace, client } = yield* findCardSpace(params.cardSpace)

    const typeRefs = cardSpace.types
    if (typeRefs.length === 0) {
      return { masterTags: [], total: 0 }
    }

    const tags = yield* client.findAll<HulyMasterTag>(
      cardPlugin.class.MasterTag,
      { _id: { $in: typeRefs } }
    )

    const summaries: Array<MasterTagSummary> = tags.map((t) => ({
      id: MasterTagId.make(t._id),
      name: t.label
    }))

    return {
      masterTags: summaries,
      total: tags.total
    }
  })

export const listCards = (
  params: ListCardsParams
): Effect.Effect<ListCardsResult, ListCardsError, HulyClient> =>
  Effect.gen(function*() {
    const { cardSpace, client } = yield* findCardSpace(params.cardSpace)

    const limit = clampLimit(params.limit)

    const query: DocumentQuery<HulyCard> = {
      space: cardSpace._id
    }

    if (params.type !== undefined) {
      const masterTag = yield* findMasterTag(client, cardSpace, params.type)
      query._class = masterTag._id
    }

    if (params.titleSearch !== undefined && params.titleSearch.trim() !== "") {
      query.title = { $like: `%${escapeLikeWildcards(params.titleSearch)}%` }
    }

    if (params.titleRegex !== undefined && params.titleRegex.trim() !== "") {
      query.title = { $regex: params.titleRegex }
    }

    if (params.contentSearch !== undefined && params.contentSearch.trim() !== "") {
      query.$search = params.contentSearch
    }

    const cards = yield* client.findAll<HulyCard>(
      cardPlugin.class.Card,
      query,
      {
        limit,
        sort: {
          modifiedOn: SortingOrder.Descending
        }
      }
    )

    const summaries: Array<CardSummary> = cards.map((c) => ({
      id: CardId.make(c._id),
      title: c.title,
      type: String(c._class),
      modifiedOn: c.modifiedOn
    }))

    return {
      cards: summaries,
      total: cards.total
    }
  })

export const getCard = (
  params: GetCardParams
): Effect.Effect<CardDetail, GetCardError, HulyClient> =>
  Effect.gen(function*() {
    const { card, cardSpace, client } = yield* findCardSpaceAndCard({
      card: params.card,
      cardSpace: params.cardSpace
    })

    const content: string | undefined = card.content
      ? yield* client.fetchMarkup(
        card._class,
        card._id,
        "content",
        card.content,
        "markdown"
      )
      : undefined

    return {
      id: CardId.make(card._id),
      title: card.title,
      content,
      type: String(card._class),
      parent: card.parent ? String(card.parent) : undefined,
      children: card.children,
      cardSpace: cardSpace.name,
      modifiedOn: card.modifiedOn,
      createdOn: card.createdOn
    }
  })

export const createCard = (
  params: CreateCardParams
): Effect.Effect<CreateCardResult, CreateCardError, HulyClient> =>
  Effect.gen(function*() {
    const { cardSpace, client } = yield* findCardSpace(params.cardSpace)

    const masterTag = yield* findMasterTag(client, cardSpace, params.type)

    const cardId: Ref<HulyCard> = generateId()

    const lastCard = yield* client.findOne<HulyCard>(
      cardPlugin.class.Card,
      { space: cardSpace._id },
      { sort: { rank: SortingOrder.Descending } }
    )
    const rank = makeRank(lastCard?.rank, undefined)

    // Card.content is non-nullable MarkupBlobRef — always upload content
    const contentMarkupRef = yield* client.uploadMarkup(
      masterTag._id,
      cardId,
      "content",
      params.content ?? "",
      "markdown"
    )

    type CardParentData = {
      parentRef: Ref<HulyCard> | null
      parentInfo: Array<{ _id: Ref<HulyCard>; _class: Ref<HulyMasterTag>; title: string }>
    }
    const parentParam = params.parent
    const { parentInfo, parentRef }: CardParentData = parentParam !== undefined
      ? yield* Effect.gen(function*() {
        const parentCard = yield* findByNameOrId(
          client,
          cardPlugin.class.Card,
          { space: cardSpace._id, title: parentParam },
          { space: cardSpace._id, _id: toRef<HulyCard>(parentParam) }
        )
        if (parentCard === undefined) {
          return yield* new CardNotFoundError({
            identifier: parentParam,
            cardSpace: cardSpace.name
          })
        }
        return {
          parentRef: parentCard._id,
          parentInfo: [
            ...parentCard.parentInfo,
            { _id: parentCard._id, _class: parentCard._class, title: parentCard.title }
          ]
        }
      })
      : { parentRef: null, parentInfo: [] }

    const cardData: Data<HulyCard> = {
      title: params.title,
      content: contentMarkupRef,
      blobs: {},
      parentInfo,
      parent: parentRef,
      rank
    }

    yield* client.createDoc(
      masterTag._id,
      cardSpace._id,
      cardData,
      cardId
    )

    return { id: CardId.make(cardId), title: params.title }
  })

export const updateCard = (
  params: UpdateCardParams
): Effect.Effect<UpdateCardResult, UpdateCardError, HulyClient> =>
  Effect.gen(function*() {
    const { card, cardSpace, client } = yield* findCardSpaceAndCard({
      card: params.card,
      cardSpace: params.cardSpace
    })

    const updateOps: DocumentUpdate<HulyCard> = {}
    let contentUpdatedInPlace = false

    if (params.title !== undefined) {
      updateOps.title = params.title
    }

    if (params.content !== undefined) {
      // Card.content is non-nullable MarkupBlobRef (unlike Document.content which can be null).
      // Empty string clears the content blob rather than nulling the field.
      if (card.content) {
        yield* client.updateMarkup(
          card._class,
          card._id,
          "content",
          params.content,
          "markdown"
        )
        contentUpdatedInPlace = true
      } else {
        const contentMarkupRef = yield* client.uploadMarkup(
          card._class,
          card._id,
          "content",
          params.content,
          "markdown"
        )
        updateOps.content = contentMarkupRef
      }
    }

    if (Object.keys(updateOps).length === 0 && !contentUpdatedInPlace) {
      return { id: CardId.make(card._id), updated: false }
    }

    if (Object.keys(updateOps).length > 0) {
      yield* client.updateDoc(
        card._class,
        cardSpace._id,
        card._id,
        updateOps
      )
    }

    return { id: CardId.make(card._id), updated: true }
  })

export const deleteCard = (
  params: DeleteCardParams
): Effect.Effect<DeleteCardResult, DeleteCardError, HulyClient> =>
  Effect.gen(function*() {
    const { card, cardSpace, client } = yield* findCardSpaceAndCard({
      card: params.card,
      cardSpace: params.cardSpace
    })

    yield* client.removeDoc(
      card._class,
      cardSpace._id,
      card._id
    )

    return { id: CardId.make(card._id), deleted: true }
  })
