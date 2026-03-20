/**
 * WorkspaceClient - Workspace and account management operations.
 *
 * Uses @hcengineering/account-client (AccountClient) for:
 * - Workspace lifecycle: create, delete, list workspaces
 * - Member management: list members, update roles
 * - User profiles: get/update profile settings
 * - Guest settings: read-only access, sign-up permissions
 * - Regions: available deployment regions
 *
 * For data operations within a workspace (issues, documents, etc.),
 * see HulyClient in client.ts.
 *
 * @module
 */
import type {
  AccountClient,
  PersonWithProfile,
  RegionInfo,
  UserProfile,
  WorkspaceLoginInfo
} from "@hcengineering/account-client"
import { getClient as getAccountClient } from "@hcengineering/account-client"
import { getWorkspaceToken, loadServerConfig } from "@hcengineering/api-client"
import type {
  AccountRole,
  Person,
  PersonInfo,
  PersonUuid,
  SocialId,
  WorkspaceInfoWithStatus,
  WorkspaceMemberInfo
} from "@hcengineering/core"
import { Context, Effect, Layer } from "effect"

import { HulyConfigService } from "../config/config.js"
import { authToOptions, type ConnectionConfig, type ConnectionError, connectWithRetry } from "./auth-utils.js"
import { HulyConnectionError } from "./errors.js"

export type WorkspaceClientError = ConnectionError

export interface WorkspaceClientOperations {
  readonly getWorkspaceMembers: () => Effect.Effect<Array<WorkspaceMemberInfo>, WorkspaceClientError>
  readonly getPersonInfo: (account: PersonUuid) => Effect.Effect<PersonInfo, WorkspaceClientError>
  readonly updateWorkspaceRole: (account: string, role: AccountRole) => Effect.Effect<void, WorkspaceClientError>
  readonly getWorkspaceInfo: (updateLastVisit?: boolean) => Effect.Effect<WorkspaceInfoWithStatus, WorkspaceClientError>
  readonly getUserWorkspaces: () => Effect.Effect<Array<WorkspaceInfoWithStatus>, WorkspaceClientError>
  readonly createWorkspace: (name: string, region?: string) => Effect.Effect<WorkspaceLoginInfo, WorkspaceClientError>
  readonly deleteWorkspace: () => Effect.Effect<void, WorkspaceClientError>
  readonly getUserProfile: (personUuid?: PersonUuid) => Effect.Effect<PersonWithProfile | null, WorkspaceClientError>
  readonly setMyProfile: (
    profile: Partial<Omit<UserProfile, "personUuid">>
  ) => Effect.Effect<void, WorkspaceClientError>
  readonly updateAllowReadOnlyGuests: (
    readOnlyGuestsAllowed: boolean
  ) => Effect.Effect<{ guestPerson: Person; guestSocialIds: Array<SocialId> } | undefined, WorkspaceClientError>
  readonly updateAllowGuestSignUp: (
    guestSignUpAllowed: boolean
  ) => Effect.Effect<void, WorkspaceClientError>
  readonly getRegionInfo: () => Effect.Effect<Array<RegionInfo>, WorkspaceClientError>
}

export class WorkspaceClient extends Context.Tag("@hulymcp/WorkspaceClient")<
  WorkspaceClient,
  WorkspaceClientOperations
>() {
  static readonly layer: Layer.Layer<
    WorkspaceClient,
    WorkspaceClientError,
    HulyConfigService
  > = Layer.scoped(
    WorkspaceClient,
    Effect.gen(function*() {
      const config = yield* HulyConfigService

      const { client } = yield* connectAccountClientWithRetry({
        url: config.url,
        auth: config.auth,
        workspace: config.workspace
      })

      const withClient = <A>(
        op: (client: AccountClient) => Promise<A>,
        errorMsg: string
      ): Effect.Effect<A, WorkspaceClientError> =>
        Effect.tryPromise({
          try: () => op(client),
          catch: (e) =>
            new HulyConnectionError({
              message: `${errorMsg}: ${String(e)}`,
              cause: e
            })
        })

      const operations: WorkspaceClientOperations = {
        getWorkspaceMembers: () => withClient((c) => c.getWorkspaceMembers(), "Failed to get workspace members"),
        getPersonInfo: (account) => withClient((c) => c.getPersonInfo(account), "Failed to get person info"),
        updateWorkspaceRole: (account, role) =>
          withClient((c) => c.updateWorkspaceRole(account, role), "Failed to update workspace role"),
        getWorkspaceInfo: (updateLastVisit) =>
          withClient((c) => c.getWorkspaceInfo(updateLastVisit), "Failed to get workspace info"),
        getUserWorkspaces: () => withClient((c) => c.getUserWorkspaces(), "Failed to get user workspaces"),
        createWorkspace: (name, region) =>
          withClient((c) => c.createWorkspace(name, region), "Failed to create workspace"),
        deleteWorkspace: () => withClient((c) => c.deleteWorkspace(), "Failed to delete workspace"),
        getUserProfile: (personUuid) => withClient((c) => c.getUserProfile(personUuid), "Failed to get user profile"),
        setMyProfile: (profile) => withClient((c) => c.setMyProfile(profile), "Failed to set my profile"),
        updateAllowReadOnlyGuests: (readOnlyGuestsAllowed) =>
          withClient(
            (c) => c.updateAllowReadOnlyGuests(readOnlyGuestsAllowed),
            "Failed to update read-only guest setting"
          ),
        updateAllowGuestSignUp: (guestSignUpAllowed) =>
          withClient((c) => c.updateAllowGuestSignUp(guestSignUpAllowed), "Failed to update guest sign-up setting"),
        getRegionInfo: () => withClient((c) => c.getRegionInfo(), "Failed to get region info")
      }

      return operations
    })
  )

  static testLayer(
    mockOps: Partial<WorkspaceClientOperations>
  ): Layer.Layer<WorkspaceClient> {
    const notImplemented = (name: string) => (): Effect.Effect<never, WorkspaceClientError> =>
      Effect.die(new Error(`${name} not implemented in test layer`))

    const defaultOps: WorkspaceClientOperations = {
      getWorkspaceMembers: () => Effect.succeed([]),
      getPersonInfo: notImplemented("getPersonInfo"),
      updateWorkspaceRole: notImplemented("updateWorkspaceRole"),
      getWorkspaceInfo: notImplemented("getWorkspaceInfo"),
      getUserWorkspaces: () => Effect.succeed([]),
      createWorkspace: notImplemented("createWorkspace"),
      deleteWorkspace: notImplemented("deleteWorkspace"),
      getUserProfile: () => Effect.succeed(null),
      setMyProfile: notImplemented("setMyProfile"),
      updateAllowReadOnlyGuests: notImplemented("updateAllowReadOnlyGuests"),
      updateAllowGuestSignUp: notImplemented("updateAllowGuestSignUp"),
      getRegionInfo: () => Effect.succeed([])
    }

    return Layer.succeed(WorkspaceClient, { ...defaultOps, ...mockOps })
  }
}

const connectAccountClient = async (
  config: ConnectionConfig
): Promise<{ client: AccountClient; token: string }> => {
  const serverConfig = await loadServerConfig(config.url)
  const authOptions = authToOptions(config.auth, config.workspace)
  const { token } = await getWorkspaceToken(config.url, authOptions, serverConfig)
  const client = getAccountClient(serverConfig.ACCOUNTS_URL, token)
  return { client, token }
}

const connectAccountClientWithRetry = (
  config: ConnectionConfig
): Effect.Effect<{ client: AccountClient; token: string }, ConnectionError> =>
  connectWithRetry(() => connectAccountClient(config), "Connection failed")
