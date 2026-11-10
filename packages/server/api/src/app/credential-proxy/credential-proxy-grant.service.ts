import { ActivepiecesError, apId, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionType, AppConnectionValue, CredentialGrantField, CredentialGrantKind, CredentialGrantRecord, credentialPlaceholder, ResolveCredentialGrantResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../app-connection/app-connection-service/app-connection-service'
import { getCredentialGrantIndexKey, getCredentialGrantKey } from '../database/redis/keys'
import { distributedStore } from '../database/redis-connections'
import { secretManagersService } from '../ee/secret-managers/secret-managers.service'
import { EncryptedObject, encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { pieceMetadataService } from '../pieces/metadata/piece-metadata-service'
import { variableService } from '../variable/variable.service'
import { AllowedHosts, allowedHostsResolver } from './allowed-hosts-resolver'
import { credentialFieldExtractor } from './credential-field-extractor'
import { credentialProxyAuth } from './credential-proxy-auth'

export const credentialProxyGrantService = (log: FastifyBaseLogger) => ({
    isEnabled(): boolean {
        return credentialProxyAuth.isConfigured()
    },

    async issueForConnection({ connection, projectId, jobId }: IssueForConnectionParams): Promise<AppConnectionValue> {
        const { fields, allowedHosts, allowAnyHost } = await describeConnection({ connection, log })
        if (fields.length === 0) {
            return connection.value
        }
        const grant = await issueOrReuse({
            subject: `connection:${connection.externalId}`,
            record: {
                kind: CredentialGrantKind.CONNECTION,
                platformId: connection.platformId,
                projectId,
                jobId,
                connectionExternalId: connection.externalId,
                pieceName: connection.pieceName,
                pieceVersion: connection.pieceVersion,
                fields,
                allowedHosts,
                allowAnyHost,
            },
        })
        return credentialFieldExtractor.applyPlaceholders({
            value: credentialFieldExtractor.redactUnresolvable(connection.value),
            grantId: grant.grantId,
            fields: grant.fields,
        })
    },

    async issueForVariable({ name, projectId, platformId, jobId }: IssueForVariableParams): Promise<string> {
        const grant = await issueOrReuse({
            subject: `variable:${name}`,
            record: {
                kind: CredentialGrantKind.VARIABLE,
                platformId,
                projectId,
                jobId,
                variableName: name,
                fields: [VARIABLE_FIELD],
                allowedHosts: [],
                allowAnyHost: true,
            },
        })
        return credentialPlaceholder.build({ grantId: grant.grantId, fieldIndex: VARIABLE_FIELD.index })
    },

    async resolve({ grantId }: ResolveParams): Promise<ResolveCredentialGrantResponse> {
        const grant = await loadGrant(grantId)
        if (isNil(grant)) {
            throw grantNotFound(grantId)
        }
        const live = await currentStateOf({ grant, log })
        if (JSON.stringify(live.fields) !== JSON.stringify(grant.fields)) {
            throw grantNotFound(grantId)
        }
        const fields = grant.fields.flatMap((field) => {
            const value = credentialFieldExtractor.readAtPath({ value: live.value, path: field.path })
            return isNil(value) ? [] : [{ index: field.index, value }]
        })
        return {
            grantId: grant.grantId,
            pieceName: grant.pieceName,
            fields,
            allowedHosts: live.allowedHosts,
            allowAnyHost: live.allowAnyHost,
            expiresAt: grant.expiresAt,
        }
    },
})

function grantNotFound(grantId: string): ActivepiecesError {
    return new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
            entityType: 'CredentialGrant',
            entityId: grantId,
        },
    })
}

async function describeConnection({ connection, log }: { connection: AppConnection, log: FastifyBaseLogger }): Promise<ConnectionDescription> {
    const pieceAuth = needsPieceAuth(connection.value) ? await loadPieceAuth({ connection, log }) : undefined
    const fields = credentialFieldExtractor.extract({ value: connection.value, pieceAuth })
    const excludedPropKeys = new Set(fields.flatMap((field) => (field.path[0] === 'props' && !isNil(field.path[1]) ? [field.path[1]] : [])))
    return { fields, ...allowedHostsResolver.resolve({ value: connection.value, excludedPropKeys }) }
}

async function issueOrReuse({ subject, record }: IssueOrReuseParams): Promise<CredentialGrantRecord> {
    const indexKey = getCredentialGrantIndexKey({ jobId: record.jobId, subject })
    const existingGrantId = await distributedStore.get<string>(indexKey)
    const existing = isNil(existingGrantId) ? null : await loadGrant(existingGrantId)
    if (!isNil(existing) && isReusable({ existing, record })) {
        return existing
    }
    const ttlSeconds = grantTtlSeconds()
    const grant: CredentialGrantRecord = {
        ...record,
        grantId: apId(),
        expiresAt: Date.now() + ttlSeconds * 1000,
    }
    await distributedStore.putBatch([
        { key: getCredentialGrantKey(grant.grantId), value: await encryptUtils.encryptObject(grant) },
        { key: indexKey, value: grant.grantId },
    ], ttlSeconds)
    return grant
}

function isReusable({ existing, record }: { existing: CredentialGrantRecord, record: IssueOrReuseParams['record'] }): boolean {
    const expiresSoon = existing.expiresAt - Date.now() < GRANT_REISSUE_WINDOW_MS
    const sameShape = JSON.stringify(existing.fields) === JSON.stringify(record.fields)
        && JSON.stringify(existing.allowedHosts) === JSON.stringify(record.allowedHosts)
        && existing.allowAnyHost === record.allowAnyHost
    return !expiresSoon && sameShape
}

function needsPieceAuth(value: AppConnectionValue): boolean {
    return value.type === AppConnectionType.CUSTOM_AUTH || value.type === AppConnectionType.OIDC
}

async function loadGrant(grantId: string): Promise<CredentialGrantRecord | null> {
    const encrypted = await distributedStore.get<EncryptedObject>(getCredentialGrantKey(grantId))
    if (isNil(encrypted)) {
        return null
    }
    return encryptUtils.decryptObject<CredentialGrantRecord>(encrypted)
}

async function currentStateOf({ grant, log }: { grant: CredentialGrantRecord, log: FastifyBaseLogger }): Promise<LiveGrantState> {
    if (grant.kind === CredentialGrantKind.VARIABLE) {
        if (isNil(grant.variableName)) {
            return { value: {}, fields: [], allowedHosts: [], allowAnyHost: true }
        }
        const value = await variableService(log).getDecryptedValueForWorker({
            projectId: grant.projectId,
            name: grant.variableName,
        })
        return { value: { value }, fields: [VARIABLE_FIELD], allowedHosts: [], allowAnyHost: true }
    }
    const connection = isNil(grant.connectionExternalId) ? null : await appConnectionService(log).getOne({
        projectId: grant.projectId,
        platformId: grant.platformId,
        externalId: grant.connectionExternalId,
    })
    if (isNil(connection)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'AppConnection',
                entityId: grant.connectionExternalId,
            },
        })
    }
    const resolved: AppConnection = {
        ...connection,
        value: await secretManagersService(log).resolveObject({
            value: connection.value,
            projectIds: [grant.projectId],
            platformId: grant.platformId,
            throwOnFailure: false,
        }),
    }
    return { value: resolved.value, ...await describeConnection({ connection: resolved, log }) }
}

async function loadPieceAuth({ connection, log }: { connection: AppConnection, log: FastifyBaseLogger }): Promise<PieceMetadataModel['auth']> {
    const { data: piece } = await tryCatch(() => pieceMetadataService(log).getOrThrow({
        name: connection.pieceName,
        version: connection.pieceVersion,
        platformId: connection.platformId,
    }))
    return piece?.auth
}

function grantTtlSeconds(): number {
    const longestJobTimeoutSeconds = Math.max(
        system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
        system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
        system.getNumberOrThrow(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS),
    )
    return longestJobTimeoutSeconds + system.getNumberOrThrow(AppSystemProp.CREDENTIAL_PROXY_GRANT_TTL_MARGIN_SECONDS)
}

const VARIABLE_FIELD: CredentialGrantField = { index: 0, path: ['value'] }
const GRANT_REISSUE_WINDOW_MS = 5 * 60 * 1000

type IssueForConnectionParams = {
    connection: AppConnection
    projectId: string
    jobId: string
}

type IssueForVariableParams = {
    name: string
    projectId: string
    platformId: string
    jobId: string
}

type ResolveParams = {
    grantId: string
}

type IssueOrReuseParams = {
    subject: string
    record: Omit<CredentialGrantRecord, 'grantId' | 'expiresAt'>
}

type ConnectionDescription = AllowedHosts & {
    fields: CredentialGrantField[]
}

type LiveGrantState = ConnectionDescription & {
    value: Record<string, unknown>
}
