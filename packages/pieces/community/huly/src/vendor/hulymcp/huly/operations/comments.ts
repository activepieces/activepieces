import type { ChatMessage } from "@hcengineering/chunter"
import { type AttachedData, type DocumentUpdate, generateId, type Ref, SortingOrder } from "@hcengineering/core"
import { Clock, Effect, Schema } from "effect"

import type {
  AddCommentParams,
  Comment,
  DeleteCommentParams,
  ListCommentsParams,
  UpdateCommentParams
} from "../../domain/schemas.js"
import { CommentSchema } from "../../domain/schemas/comments.js"
import type { AddCommentResult, DeleteCommentResult, UpdateCommentResult } from "../../domain/schemas/comments.js"
import { CommentId, IssueIdentifier } from "../../domain/schemas/shared.js"
import type { HulyClient, HulyClientError } from "../client.js"
import type { IssueNotFoundError, ProjectNotFoundError } from "../errors.js"
import { CommentNotFoundError, HulyConnectionError } from "../errors.js"
import { clampLimit, findProjectAndIssue as findProjectAndIssueShared, toRef } from "./shared.js"

import { chunter, tracker } from "../huly-plugins.js"

type ListCommentsError =
  | HulyClientError
  | HulyConnectionError
  | ProjectNotFoundError
  | IssueNotFoundError

type AddCommentError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError

type UpdateCommentError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | CommentNotFoundError

type DeleteCommentError =
  | HulyClientError
  | ProjectNotFoundError
  | IssueNotFoundError
  | CommentNotFoundError

// --- Helpers ---

const findProjectAndIssue = (
  params: { project: string; issueIdentifier: string }
) => findProjectAndIssueShared({ project: params.project, identifier: params.issueIdentifier })

const findComment = (params: { project: string; issueIdentifier: string; commentId: string }) =>
  Effect.gen(function*() {
    const { client, issue, project } = yield* findProjectAndIssue({
      project: params.project,
      issueIdentifier: params.issueIdentifier
    })

    const comment = yield* client.findOne<ChatMessage>(
      chunter.class.ChatMessage,
      {
        _id: toRef<ChatMessage>(params.commentId),
        attachedTo: issue._id
      }
    )

    if (comment === undefined) {
      return yield* new CommentNotFoundError({
        commentId: params.commentId,
        issueIdentifier: params.issueIdentifier,
        project: params.project
      })
    }

    return { client, issue, project, comment }
  })

// --- Operations ---

/**
 * List comments on an issue.
 * Results sorted by createdOn ascending (oldest first).
 */
export const listComments = (
  params: ListCommentsParams
): Effect.Effect<Array<Comment>, ListCommentsError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue } = yield* findProjectAndIssue({
      project: params.project,
      issueIdentifier: params.issueIdentifier
    })

    const limit = clampLimit(params.limit)

    const messages = yield* client.findAll<ChatMessage>(
      chunter.class.ChatMessage,
      {
        attachedTo: issue._id,
        attachedToClass: tracker.class.Issue
      },
      {
        limit,
        sort: {
          createdOn: SortingOrder.Ascending
        }
      }
    )

    // Spread: Schema.decodeUnknown returns readonly array; return type requires mutable
    const validated = yield* Schema.decodeUnknown(Schema.Array(CommentSchema))(
      messages.map((msg) => ({
        id: msg._id,
        body: msg.message,
        authorId: msg.modifiedBy,
        createdOn: msg.createdOn,
        modifiedOn: msg.modifiedOn,
        editedOn: msg.editedOn
      }))
    ).pipe(
      Effect.mapError((parseError) =>
        new HulyConnectionError({
          message: `listComments response failed schema validation: ${parseError.message}`,
          cause: parseError
        })
      )
    )

    return [...validated]
  })

/**
 * Add a comment to an issue.
 */
export const addComment = (
  params: AddCommentParams
): Effect.Effect<AddCommentResult, AddCommentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, issue, project } = yield* findProjectAndIssue({
      project: params.project,
      issueIdentifier: params.issueIdentifier
    })

    const commentId: Ref<ChatMessage> = generateId()

    const commentData: AttachedData<ChatMessage> = {
      message: params.body
    }

    yield* client.addCollection(
      chunter.class.ChatMessage,
      project._id,
      issue._id,
      tracker.class.Issue,
      "comments",
      commentData,
      commentId
    )

    return {
      commentId: CommentId.make(commentId),
      issueIdentifier: IssueIdentifier.make(issue.identifier)
    }
  })

/**
 * Update an existing comment on an issue.
 */
export const updateComment = (
  params: UpdateCommentParams
): Effect.Effect<UpdateCommentResult, UpdateCommentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, comment, issue, project } = yield* findComment(params)

    if (params.body === comment.message) {
      return {
        commentId: CommentId.make(params.commentId),
        issueIdentifier: IssueIdentifier.make(issue.identifier),
        updated: false
      }
    }

    const now = yield* Clock.currentTimeMillis
    const updateOps: DocumentUpdate<ChatMessage> = {
      message: params.body,
      editedOn: now
    }

    yield* client.updateDoc(
      chunter.class.ChatMessage,
      project._id,
      comment._id,
      updateOps
    )

    return {
      commentId: CommentId.make(params.commentId),
      issueIdentifier: IssueIdentifier.make(issue.identifier),
      updated: true
    }
  })

/**
 * Delete a comment from an issue.
 */
export const deleteComment = (
  params: DeleteCommentParams
): Effect.Effect<DeleteCommentResult, DeleteCommentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, comment, issue, project } = yield* findComment(params)

    yield* client.removeDoc(
      chunter.class.ChatMessage,
      project._id,
      comment._id
    )

    return {
      commentId: CommentId.make(params.commentId),
      issueIdentifier: IssueIdentifier.make(issue.identifier),
      deleted: true
    }
  })
