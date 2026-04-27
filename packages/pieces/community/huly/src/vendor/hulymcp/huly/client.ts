/**
 * HulyClient - Data operations within a workspace.
 *
 * Uses @hcengineering/api-client (TxOperations) for CRUD on documents:
 * issues, projects, milestones, documents, contacts, comments, etc.
 *
 * For workspace/account management (members, settings, workspace lifecycle),
 * see WorkspaceClient in workspace-client.ts.
 *
 * @module
 */
import {
  createRestClient,
  createRestTxOperations,
  getWorkspaceToken,
  loadServerConfig,
  type MarkupFormat,
  type MarkupRef
} from "@hcengineering/api-client"
import { getClient as getCollaboratorClient } from "@hcengineering/collaborator-client"
import {
  type AccountUuid,
  type AttachedData,
  type AttachedDoc,
  type Class,
  type Data,
  type Doc,
  type DocumentQuery,
  type DocumentUpdate,
  type FindOptions,
  type FindResult,
  makeCollabId,
  type Ref,
  type SearchOptions,
  type SearchQuery,
  type SearchResult,
  type Space,
  toFindResult,
  type TxOperations,
  type TxResult,
  type WithLookup,
  type WorkspaceUuid
} from "@hcengineering/core"
import { htmlToJSON, jsonToHTML, jsonToMarkup, markupToJSON } from "@hcengineering/text"
import { markdownToMarkup, markupToMarkdown } from "@hcengineering/text-markdown"
import { absurd, Context, Effect, Layer } from "effect"

import { HulyConfigService } from "../config/config.js"
import { concatLink } from "../utils/url.js"
import { authToOptions, type ConnectionConfig, type ConnectionError, connectWithRetry } from "./auth-utils.js"
import { HulyConnectionError } from "./errors.js"

interface MarkupConvertOptions {
  readonly refUrl: string
  readonly imageUrl: string
}

function toInternalMarkup(
  value: string,
  format: MarkupFormat,
  opts: MarkupConvertOptions
): string {
  switch (format) {
    case "markup":
      return value
    case "html":
      return jsonToMarkup(htmlToJSON(value))
    case "markdown":
      return jsonToMarkup(markdownToMarkup(value, opts))
    default:
      absurd(format)
      throw new Error(`Invalid format: ${format}`)
  }
}

function fromInternalMarkup(
  markup: string,
  format: MarkupFormat,
  opts: MarkupConvertOptions
): string {
  switch (format) {
    case "markup":
      return markup
    case "html":
      return jsonToHTML(markupToJSON(markup))
    case "markdown":
      return markupToMarkdown(markupToJSON(markup), opts)
    default:
      absurd(format)
      throw new Error(`Invalid format: ${format}`)
  }
}

export type HulyClientError = ConnectionError

export interface HulyClientOperations {
  readonly getAccountUuid: () => AccountUuid

  readonly findAll: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ) => Effect.Effect<FindResult<T>, HulyClientError>

  readonly findOne: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ) => Effect.Effect<WithLookup<T> | undefined, HulyClientError>

  readonly createDoc: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    attributes: Data<T>,
    id?: Ref<T>
  ) => Effect.Effect<Ref<T>, HulyClientError>

  readonly updateDoc: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    operations: DocumentUpdate<T>,
    retrieve?: boolean
  ) => Effect.Effect<TxResult, HulyClientError>

  readonly addCollection: <T extends Doc, P extends AttachedDoc>(
    _class: Ref<Class<P>>,
    space: Ref<Space>,
    attachedTo: Ref<T>,
    attachedToClass: Ref<Class<T>>,
    collection: string,
    attributes: AttachedData<P>,
    id?: Ref<P>
  ) => Effect.Effect<Ref<P>, HulyClientError>

  readonly removeDoc: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ) => Effect.Effect<TxResult, HulyClientError>

  readonly uploadMarkup: (
    objectClass: Ref<Class<Doc>>,
    objectId: Ref<Doc>,
    objectAttr: string,
    markup: string,
    format: MarkupFormat
  ) => Effect.Effect<MarkupRef, HulyClientError>

  readonly fetchMarkup: (
    objectClass: Ref<Class<Doc>>,
    objectId: Ref<Doc>,
    objectAttr: string,
    id: MarkupRef,
    format: MarkupFormat
  ) => Effect.Effect<string, HulyClientError>

  readonly updateMarkup: (
    objectClass: Ref<Class<Doc>>,
    objectId: Ref<Doc>,
    objectAttr: string,
    markup: string,
    format: MarkupFormat
  ) => Effect.Effect<void, HulyClientError>

  readonly searchFulltext: (
    query: SearchQuery,
    options: SearchOptions
  ) => Effect.Effect<SearchResult, HulyClientError>
}

export class HulyClient extends Context.Tag("@hulymcp/HulyClient")<
  HulyClient,
  HulyClientOperations
>() {
  static readonly layer: Layer.Layer<
    HulyClient,
    HulyClientError,
    HulyConfigService
  > = Layer.scoped(
    HulyClient,
    Effect.gen(function*() {
      const config = yield* HulyConfigService

      const { accountUuid, client, markupOps } = yield* connectRestWithRetry({
        url: config.url,
        auth: config.auth,
        workspace: config.workspace
      })

      const withClient = <A>(
        op: (client: TxOperations) => Promise<A>,
        errorMsg: string
      ): Effect.Effect<A, HulyClientError> =>
        Effect.tryPromise({
          try: () => op(client),
          catch: (e) =>
            new HulyConnectionError({
              message: `${errorMsg}: ${String(e)}`,
              cause: e
            })
        })

      const operations: HulyClientOperations = {
        getAccountUuid: () => accountUuid,

        findAll: <T extends Doc>(
          _class: Ref<Class<T>>,
          query: DocumentQuery<T>,
          options?: FindOptions<T>
        ) =>
          withClient(
            (client) => client.findAll(_class, query, options),
            "findAll failed"
          ),

        findOne: <T extends Doc>(
          _class: Ref<Class<T>>,
          query: DocumentQuery<T>,
          options?: FindOptions<T>
        ) =>
          withClient(
            (client) => client.findOne(_class, query, options),
            "findOne failed"
          ),

        createDoc: <T extends Doc>(
          _class: Ref<Class<T>>,
          space: Ref<Space>,
          attributes: Data<T>,
          id?: Ref<T>
        ) =>
          withClient(
            (client) => client.createDoc(_class, space, attributes, id),
            "createDoc failed"
          ),

        updateDoc: <T extends Doc>(
          _class: Ref<Class<T>>,
          space: Ref<Space>,
          objectId: Ref<T>,
          ops: DocumentUpdate<T>,
          retrieve?: boolean
        ) =>
          withClient(
            (client) => client.updateDoc(_class, space, objectId, ops, retrieve),
            "updateDoc failed"
          ),

        addCollection: <T extends Doc, P extends AttachedDoc>(
          _class: Ref<Class<P>>,
          space: Ref<Space>,
          attachedTo: Ref<T>,
          attachedToClass: Ref<Class<T>>,
          collection: string,
          attributes: AttachedData<P>,
          id?: Ref<P>
        ) =>
          withClient(
            (client) =>
              client.addCollection(
                _class,
                space,
                attachedTo,
                attachedToClass,
                collection,
                attributes,
                id
              ),
            "addCollection failed"
          ),

        removeDoc: <T extends Doc>(
          _class: Ref<Class<T>>,
          space: Ref<Space>,
          objectId: Ref<T>
        ) =>
          withClient(
            (client) => client.removeDoc(_class, space, objectId),
            "removeDoc failed"
          ),

        uploadMarkup: (objectClass, objectId, objectAttr, markup, format) =>
          Effect.tryPromise({
            try: () => markupOps.uploadMarkup(objectClass, objectId, objectAttr, markup, format),
            catch: (e) =>
              new HulyConnectionError({
                message: `uploadMarkup failed: ${String(e)}`,
                cause: e
              })
          }),

        fetchMarkup: (objectClass, objectId, objectAttr, id, format) =>
          Effect.tryPromise({
            try: () => markupOps.fetchMarkup(objectClass, objectId, objectAttr, id, format),
            catch: (e) =>
              new HulyConnectionError({
                message: `fetchMarkup failed: ${String(e)}`,
                cause: e
              })
          }),

        updateMarkup: (objectClass, objectId, objectAttr, markup, format) =>
          Effect.tryPromise({
            try: () => markupOps.updateMarkup(objectClass, objectId, objectAttr, markup, format),
            catch: (e) =>
              new HulyConnectionError({
                message: `updateMarkup failed: ${String(e)}`,
                cause: e
              })
          }),

        searchFulltext: (query, options) =>
          withClient(
            (client) => client.searchFulltext(query, options),
            "searchFulltext failed"
          )
      }

      return operations
    })
  )

  static testLayer(
    mockOperations: Partial<HulyClientOperations>
  ): Layer.Layer<HulyClient> {
    const noopFindAll = <T extends Doc>(): Effect.Effect<
      FindResult<T>,
      HulyClientError
    > => Effect.succeed(toFindResult<T>([]))

    const noopFindOne = <T extends Doc>(): Effect.Effect<
      WithLookup<T> | undefined,
      HulyClientError
    > => Effect.succeed(undefined)

    const notImplemented = (name: string) => (): Effect.Effect<never, HulyClientError> =>
      Effect.die(new Error(`${name} not implemented in test layer`))

    const noopFetchMarkup = (): Effect.Effect<string, HulyClientError> => Effect.succeed("")

    const defaultOps: HulyClientOperations = {
      // AccountUuid is a double-branded string type with no public constructor
      // eslint-disable-next-line no-restricted-syntax -- see above
      getAccountUuid: () => "test-account-uuid" as AccountUuid,
      findAll: noopFindAll,
      findOne: noopFindOne,
      createDoc: notImplemented("createDoc"),
      updateDoc: notImplemented("updateDoc"),
      addCollection: notImplemented("addCollection"),
      removeDoc: notImplemented("removeDoc"),
      uploadMarkup: notImplemented("uploadMarkup"),
      fetchMarkup: noopFetchMarkup,
      updateMarkup: notImplemented("updateMarkup"),
      searchFulltext: notImplemented("searchFulltext")
    }

    return Layer.succeed(HulyClient, { ...defaultOps, ...mockOperations })
  }
}

interface MarkupOperations {
  fetchMarkup: (
    objectClass: Ref<Class<Doc>>,
    objectId: Ref<Doc>,
    objectAttr: string,
    id: MarkupRef,
    format: MarkupFormat
  ) => Promise<string>
  uploadMarkup: (
    objectClass: Ref<Class<Doc>>,
    objectId: Ref<Doc>,
    objectAttr: string,
    markup: string,
    format: MarkupFormat
  ) => Promise<MarkupRef>
  updateMarkup: (
    objectClass: Ref<Class<Doc>>,
    objectId: Ref<Doc>,
    objectAttr: string,
    markup: string,
    format: MarkupFormat
  ) => Promise<void>
}

interface RestConnection {
  client: TxOperations
  accountUuid: AccountUuid
  markupOps: MarkupOperations
}

function createMarkupOps(
  url: string,
  workspace: WorkspaceUuid,
  token: string,
  collaboratorUrl: string
): MarkupOperations {
  const refUrl = concatLink(url, `/browse?workspace=${workspace}`)
  const imageUrl = concatLink(url, `/files?workspace=${workspace}&file=`)
  const collaborator = getCollaboratorClient(workspace, token, collaboratorUrl)

  return {
    async fetchMarkup(objectClass, objectId, objectAttr, doc, format) {
      const collabId = makeCollabId(objectClass, objectId, objectAttr)
      const markup = await collaborator.getMarkup(collabId, doc)
      return fromInternalMarkup(markup, format, { refUrl, imageUrl })
    },

    async uploadMarkup(objectClass, objectId, objectAttr, value, format) {
      const collabId = makeCollabId(objectClass, objectId, objectAttr)
      return await collaborator.createMarkup(collabId, toInternalMarkup(value, format, { refUrl, imageUrl }))
    },

    async updateMarkup(objectClass, objectId, objectAttr, value, format) {
      const collabId = makeCollabId(objectClass, objectId, objectAttr)
      return await collaborator.updateMarkup(collabId, toInternalMarkup(value, format, { refUrl, imageUrl }))
    }
  }
}

const connectRest = async (
  config: ConnectionConfig
): Promise<RestConnection> => {
  const serverConfig = await loadServerConfig(config.url)

  const authOptions = authToOptions(config.auth, config.workspace)

  const { endpoint, token, workspaceId } = await getWorkspaceToken(
    config.url,
    authOptions,
    serverConfig
  )

  // createRestTxOperations also calls getAccount() internally but doesn't expose it.
  // Extra call here is one-time at connection startup; acceptable to avoid reimplementing SDK internals.
  const restClient = createRestClient(endpoint, workspaceId, token)
  const account = await restClient.getAccount()

  const client = await createRestTxOperations(endpoint, workspaceId, token)
  const markupOps = createMarkupOps(
    config.url,
    workspaceId,
    token,
    serverConfig.COLLABORATOR_URL
  )

  return { client, accountUuid: account.uuid, markupOps }
}

const connectRestWithRetry = (
  config: ConnectionConfig
): Effect.Effect<RestConnection, ConnectionError> => connectWithRetry(() => connectRest(config), "Connection failed")
