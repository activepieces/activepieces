import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import { databaseConnection } from "@backend/database/database-connection";
import { ConnectionKeyEntity } from "./connection-key.entity";
import { SeekPage, AppConnection, ActivepiecesError, ErrorCode, AppConnectionType } from "@activepieces/shared";
import { ConnectionKey, ConnectionKeyId, UpsertSigningKeyConnection, GetOrDeleteConnectionFromTokenRequest, UpsertConnectionFromToken } from "@activepieces/ee/shared";
import { appCredentialService } from "../app-credentials/app-credentials.service";
import { ProjectId, Cursor, apId } from "@activepieces/shared";
import { paginationHelper } from "@backend/helper/pagination/pagination-utils";
import { appConnectionService } from "@backend/app-connection/app-connection.service";
import { buildPaginator } from "@backend/helper/pagination/build-paginator";

const connectonKeyRepo = databaseConnection.getRepository(ConnectionKeyEntity);


export const connectionKeyService = {

    async getConnection({ projectId, token, appName }: GetOrDeleteConnectionFromTokenRequest): Promise<AppConnection | null> {
        let connectionName = await getConnectioName({ projectId: projectId, token: token });
        if (connectionName == null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OR_EXPIRED_JWT_TOKEN,
                params: {
                    token: token
                },
            })
        }
        return (await appConnectionService.getOne({ projectId: projectId, name: `${appName}_${connectionName}` }));
    },
    async createConnection(request: UpsertConnectionFromToken): Promise<AppConnection> {
        const appCredential = await appCredentialService.getOneOrThrow(request.appCredentialId);
        const projectId = appCredential.projectId;
        let connectionName = await getConnectioName({ projectId, token: request.token });
        if (connectionName == null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OR_EXPIRED_JWT_TOKEN,
                params: {
                    token: request.token
                },
            })
        }
        return await appConnectionService.upsert({
            projectId, request: {
                appName: appCredential.appName, name: `${appCredential.appName}_${connectionName}`, value: {
                    type: AppConnectionType.OAUTH2,
                    redirect_url: request.redirectUrl,
                    code: request.code,
                    token_url: appCredential.settings.tokenUrl,
                    scope: appCredential.settings.scope,
                    client_id: appCredential.settings.clientId,
                    client_secret: appCredential.settings.clientSecret!
                }
            }
        });
    },
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertSigningKeyConnection }): Promise<ConnectionKey> {
        const key = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: "pkcs1",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs1",
                format: "pem",
            },
        });
        const savedConnection: ConnectionKey = await connectonKeyRepo.save({
            id: apId(),
            projectId: projectId,
            settings: {
                type: request.settings.type,
                publicKey: key.publicKey
            }
        });
        return {
            ...savedConnection,
            settings: {
                type: savedConnection.settings.type,
                publicKey: savedConnection.settings.publicKey,
                privateKey: key.privateKey
            }
        };
    },
    async list(projectId: ProjectId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<ConnectionKey>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest ?? null);
        const paginator = buildPaginator({
            entity: ConnectionKeyEntity,
            query: {
                limit,
                order: "ASC",
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });
        let queryBuilder = connectonKeyRepo.createQueryBuilder("connection_key").where({ projectId: projectId });
        const { data, cursor } = await paginator.paginate(queryBuilder);
        return paginationHelper.createPage<ConnectionKey>(data, cursor);
    },
    async delete(id: ConnectionKeyId): Promise<void> {
        await connectonKeyRepo.delete({
            id: id
        });
    }
}

async function getConnectioName(request: { projectId: string, token: string }): Promise<string | null> {
    const connectionKeys = await connectonKeyRepo.findBy({ projectId: request.projectId });
    let connectionName: string | null = null;
    for (let i = 0; i < connectionKeys.length; ++i) {
        const currentKey = connectionKeys[i];
        const decodedTokenSub = decodeTokenOrNull(request.token, currentKey.settings.publicKey)?.sub;
        if (decodedTokenSub !== null && decodedTokenSub !== undefined) {
            connectionName = decodedTokenSub as string;
            break;
        }
    }
    return connectionName;
}

function decodeTokenOrNull(token: string, publicKey: string) {
    try {
        return jsonwebtoken.verify(token, publicKey!);
    } catch (e) {
        return null;
    }
}