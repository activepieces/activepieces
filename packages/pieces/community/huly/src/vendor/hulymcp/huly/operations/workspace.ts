/**
 * Workspace management operations using account-client.
 * @module
 */
import { AccountRole as HulyAccountRole, type WorkspaceInfoWithStatus } from "@hcengineering/core"
import { Effect, Option } from "effect"

import { AccountId, PersonUuid, RegionId, WorkspaceUuid } from "../../domain/schemas/shared.js"
import type {
  AccountRole,
  CreateWorkspaceParams,
  CreateWorkspaceResult,
  DeleteWorkspaceResult,
  ListWorkspaceMembersParams,
  ListWorkspacesParams,
  RegionInfo,
  UpdateGuestSettingsParams,
  UpdateGuestSettingsResult,
  UpdateMemberRoleParams,
  UpdateMemberRoleResult,
  UpdateUserProfileParams,
  UpdateUserProfileResult,
  UserProfile,
  WorkspaceInfo,
  WorkspaceMember,
  WorkspaceSummary
} from "../../domain/schemas/workspace.js"
import type { InvalidPersonUuidError } from "../errors.js"
import { WorkspaceClient, type WorkspaceClientError } from "../workspace-client.js"
import { clampLimit, validatePersonUuid } from "./shared.js"

// Exhaustive map guarantees compile-time alignment between AccountRole literals and HulyAccountRole enum.
// If either side adds a value, TS will error here.
const accountRoleMap: Record<AccountRole, HulyAccountRole> = {
  READONLYGUEST: HulyAccountRole.ReadOnlyGuest,
  DocGuest: HulyAccountRole.DocGuest,
  GUEST: HulyAccountRole.Guest,
  USER: HulyAccountRole.User,
  MAINTAINER: HulyAccountRole.Maintainer,
  OWNER: HulyAccountRole.Owner,
  ADMIN: HulyAccountRole.Admin
}

const toHulyAccountRole = (role: AccountRole): HulyAccountRole => accountRoleMap[role]

type ListWorkspaceMembersError = WorkspaceClientError
type UpdateMemberRoleError = WorkspaceClientError
type GetWorkspaceInfoError = WorkspaceClientError
type ListWorkspacesError = WorkspaceClientError
type CreateWorkspaceError = WorkspaceClientError
type DeleteWorkspaceError = WorkspaceClientError
type GetUserProfileError = WorkspaceClientError
type UpdateUserProfileError = WorkspaceClientError
type UpdateGuestSettingsError = WorkspaceClientError
type GetRegionsError = WorkspaceClientError

const formatVersion = (info: WorkspaceInfoWithStatus): string =>
  `${info.versionMajor}.${info.versionMinor}.${info.versionPatch}`

export const listWorkspaceMembers = (
  params: ListWorkspaceMembersParams
): Effect.Effect<Array<WorkspaceMember>, ListWorkspaceMembersError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient
    const limit = clampLimit(params.limit)

    const members = yield* ops.getWorkspaceMembers()

    const limitedMembers = members.slice(0, limit)

    const result = yield* Effect.forEach(
      limitedMembers,
      (member) =>
        Effect.gen(function*() {
          const personInfoResult = yield* ops.getPersonInfo(member.person).pipe(Effect.option)
          const { email, name }: { email: string | undefined; name: string | undefined } =
            Option.isSome(personInfoResult)
              ? {
                name: personInfoResult.value.name,
                email: personInfoResult.value.socialIds.find((s) => s.type === "email")?.value
              }
              : { name: undefined, email: undefined }

          return {
            personId: PersonUuid.make(member.person),
            role: member.role,
            name,
            email
          }
        }),
      { concurrency: 10 }
    )
    return result
  })

export const updateMemberRole = (
  params: UpdateMemberRoleParams
): Effect.Effect<UpdateMemberRoleResult, UpdateMemberRoleError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    yield* ops.updateWorkspaceRole(params.accountId, toHulyAccountRole(params.role))

    return {
      accountId: AccountId.make(params.accountId),
      role: params.role,
      updated: true
    }
  })

export const getWorkspaceInfo = (): Effect.Effect<WorkspaceInfo, GetWorkspaceInfoError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    const info = yield* ops.getWorkspaceInfo(false)

    return {
      uuid: WorkspaceUuid.make(info.uuid),
      name: info.name,
      url: info.url,
      region: info.region !== undefined ? RegionId.make(info.region) : undefined,
      createdOn: info.createdOn,
      allowReadOnlyGuest: info.allowReadOnlyGuest,
      allowGuestSignUp: info.allowGuestSignUp,
      version: formatVersion(info),
      mode: info.mode
    }
  })

export const listWorkspaces = (
  params: ListWorkspacesParams
): Effect.Effect<Array<WorkspaceSummary>, ListWorkspacesError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient
    const limit = clampLimit(params.limit)

    const workspaces = yield* ops.getUserWorkspaces()

    return workspaces.slice(0, limit).map((ws) => ({
      uuid: WorkspaceUuid.make(ws.uuid),
      name: ws.name,
      url: ws.url,
      region: ws.region !== undefined ? RegionId.make(ws.region) : undefined,
      createdOn: ws.createdOn,
      lastVisit: ws.lastVisit
    }))
  })

export const createWorkspace = (
  params: CreateWorkspaceParams
): Effect.Effect<CreateWorkspaceResult, CreateWorkspaceError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    const loginInfo = yield* ops.createWorkspace(params.name, params.region)

    return {
      uuid: WorkspaceUuid.make(loginInfo.workspace),
      url: loginInfo.workspaceUrl,
      name: params.name
    }
  })

export const deleteWorkspace = (): Effect.Effect<DeleteWorkspaceResult, DeleteWorkspaceError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    yield* ops.deleteWorkspace()

    return { deleted: true }
  })

export const getUserProfile = (
  personUuid?: string
): Effect.Effect<UserProfile | null, GetUserProfileError | InvalidPersonUuidError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    const validatedUuid = yield* validatePersonUuid(personUuid)
    const profile = yield* ops.getUserProfile(validatedUuid)

    if (profile === null) {
      return null
    }

    return {
      personUuid: PersonUuid.make(profile.uuid),
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      city: profile.city,
      country: profile.country,
      website: profile.website,
      socialLinks: profile.socialLinks,
      isPublic: profile.isPublic
    }
  })

export const updateUserProfile = (
  params: UpdateUserProfileParams
): Effect.Effect<UpdateUserProfileResult, UpdateUserProfileError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    const profileUpdate: Parameters<typeof ops.setMyProfile>[0] = {}

    if (params.bio !== undefined) {
      profileUpdate.bio = params.bio === null ? "" : params.bio
    }
    if (params.city !== undefined) {
      profileUpdate.city = params.city === null ? "" : params.city
    }
    if (params.country !== undefined) {
      profileUpdate.country = params.country === null ? "" : params.country
    }
    if (params.website !== undefined) {
      profileUpdate.website = params.website === null ? "" : params.website
    }
    if (params.socialLinks !== undefined) {
      profileUpdate.socialLinks = params.socialLinks === null ? {} : params.socialLinks
    }
    if (params.isPublic !== undefined) {
      profileUpdate.isPublic = params.isPublic
    }

    if (Object.keys(profileUpdate).length === 0) {
      return { updated: false }
    }

    yield* ops.setMyProfile(profileUpdate)

    return { updated: true }
  })

export const updateGuestSettings = (
  params: UpdateGuestSettingsParams
): Effect.Effect<UpdateGuestSettingsResult, UpdateGuestSettingsError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    let updated = false

    if (params.allowReadOnly !== undefined) {
      yield* ops.updateAllowReadOnlyGuests(params.allowReadOnly)
      updated = true
    }

    if (params.allowSignUp !== undefined) {
      yield* ops.updateAllowGuestSignUp(params.allowSignUp)
      updated = true
    }

    return {
      updated,
      allowReadOnly: params.allowReadOnly,
      allowSignUp: params.allowSignUp
    }
  })

export const getRegions = (): Effect.Effect<Array<RegionInfo>, GetRegionsError, WorkspaceClient> =>
  Effect.gen(function*() {
    const ops = yield* WorkspaceClient

    const regions = yield* ops.getRegionInfo()

    return regions.map((r) => ({
      region: RegionId.make(r.region),
      name: r.name
    }))
  })
