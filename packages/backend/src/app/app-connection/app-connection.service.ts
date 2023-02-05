import { apId, AppConnection, AppConnectionId, AppConnectionType, BaseOAuth2ConnectionValue, CloudOAuth2ConnectionValue, Cursor, OAuth2ConnectionValueWithApp, ProjectId, SeekPage, UpsertConnectionRequest } from "@activepieces/shared";
import { databaseConnection } from "../database/database-connection";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { AppConnectionEntity } from "./app-connection.entity";
import axios, { AxiosError } from "axios";
import { createRedisLock } from "../database/redis-connection";

const appConnectionRepo = databaseConnection.getRepository(AppConnectionEntity);

export const appConnectionService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: UpsertConnectionRequest }): Promise<AppConnection> {
        let response: any = request.value;
        switch (request.value.type) {
            case AppConnectionType.CLOUD_OAUTH2:
                response = await claimWithCloud({
                    pieceName: request.appName,
                    code: request.value.code
                })
                break;
            case AppConnectionType.OAUTH2:
                response = await claim({
                    clientSecret: request.value.client_secret,
                    clientId: request.value.client_id,
                    tokenUrl: request.value.token_url,
                    redirectUrl: request.value.redirect_url,
                    code: request.value.code
                })
                break;

            default:
                break;
        }
        const claimedUpsertRequest = { ...request, value: { ...response, ...request.value }, id: apId(), projectId };
        await appConnectionRepo.upsert({ ...claimedUpsertRequest, id: apId(), projectId: projectId }, ["name", "projectId"]);
        return appConnectionRepo.findOneByOrFail({
            projectId: projectId,
            name: request.name
        })
    },
    async getOne({ projectId, name }: { projectId: ProjectId, name: string }): Promise<AppConnection | null> {
        // We should make sure this is accessed only once, as a race condition could occur where the token needs to be refreshed and it gets accessed at the same time,
        // which could result in the wrong request saving incorrect data.
        const refreshLock = await createRedisLock(`${projectId}_${name}`);
        const appConnection = await appConnectionRepo.findOneBy({
            projectId: projectId,
            name: name
        });
        if (appConnection === null) {
            return null;
        }
        const refreshedAppConnection = await refresh(appConnection);
        await appConnectionRepo.update(refreshedAppConnection.id, refreshedAppConnection);
        refreshLock.release();
        return refreshedAppConnection;
    },
    async delete({ projectId, id }: { projectId: ProjectId, id: AppConnectionId }): Promise<void> {
        await appConnectionRepo.delete({ id: id, projectId: projectId });
    },
    async list(projectId: ProjectId, appName: string | undefined, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppConnection>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
        const paginator = buildPaginator({
            entity: AppConnectionEntity,
            paginationKeys: ["created"],
            query: {
                limit,
                order: "ASC",
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });
        let queryBuilder = appConnectionRepo.createQueryBuilder("app_connection").where({ projectId });
        if (appName !== undefined) {
            queryBuilder = queryBuilder.where({ appName });
        }
        const { data, cursor } = await paginator.paginate(queryBuilder);
        return paginationHelper.createPage<AppConnection>(data, cursor);
    }
};

async function refresh(connection: AppConnection): Promise<AppConnection> {
    switch (connection.value.type) {
        case AppConnectionType.CLOUD_OAUTH2:
            connection.value = await refreshCloud(connection.appName, connection.value);
            break;
        case AppConnectionType.OAUTH2:
            connection.value = await refreshWithCredentials(connection.value);
            break;
        case AppConnectionType.CUSTOM:
            for (const key in Object.keys(connection.value)) {
                let connectionValue = connection.value[key];
                if (typeof connectionValue === 'object' && connectionValue.hasOwnProperty('type')) {
                    const type: AppConnectionType = connectionValue.type;
                    switch (type) {
                        case AppConnectionType.CLOUD_OAUTH2:
                            connectionValue = await refreshCloud(connection.appName, connectionValue as CloudOAuth2ConnectionValue);
                            break;
                        case AppConnectionType.OAUTH2:
                            connectionValue = await refreshWithCredentials(connectionValue as OAuth2ConnectionValueWithApp);
                            break;
                        default:
                            break;
                    }
                }
            }
            break;
        default:
            break;
    }
    return connection;
}

async function claim(request: {
    clientSecret: string,
    clientId: string,
    tokenUrl: string,
    redirectUrl: string,
    code: string
}): Promise<unknown> {
    try {
        const response = (
            await axios.post(
                request.tokenUrl,
                new URLSearchParams({
                    client_id: request.clientId,
                    client_secret: request.clientSecret,
                    redirect_uri: request.redirectUrl,
                    grant_type: "authorization_code",
                    code: request.code,
                }),
                {
                    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
                }
            )
        ).data;
        return { ...formatOAuth2Response(response), client_id: request.clientId, client_secret: request.clientSecret };
    } catch (e: unknown | AxiosError) {
        if (axios.isAxiosError(e)) {
            return e.response?.data;
        }
        return e;
    }
};

async function claimWithCloud(request: {
    pieceName: string,
    code: string;
}): Promise<unknown> {
    try {
        return (await axios.post("https://secrets.activepieces.com/claim", request)).data;
    } catch (e: unknown | AxiosError) {
        if (axios.isAxiosError(e)) {
            return e.response?.data;
        }
        return e;
    }
}

function isExpired(connection: BaseOAuth2ConnectionValue) {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const refreshThreshold = 15 * 60; // Refresh if there is less than 15 minutes to expire

    if (!connection.expires_in || !connection.refresh_token) {
        return false;
    }

    return (secondsSinceEpoch >= connection.claimed_at + connection.expires_in + refreshThreshold)
}

async function refreshCloud(appName: string, connectionValue: CloudOAuth2ConnectionValue): Promise<CloudOAuth2ConnectionValue> {
    if (!isExpired(connectionValue)) {
        return connectionValue;
    }
    const response = (
        await axios.post("https://secrets.activepieces.com/refresh", {
            refreshToken: connectionValue.refresh_token,
            pieceName: appName,
        })
    ).data;;

    return {
        ...connectionValue,
        ...response,
        type: AppConnectionType.CLOUD_OAUTH2
    }
}

async function refreshWithCredentials(appConnection: OAuth2ConnectionValueWithApp): Promise<OAuth2ConnectionValueWithApp> {
    if (!isExpired(appConnection)) {
        return appConnection;
    }
    const settings = appConnection;
    const response = (
        await axios.post(
            settings.token_url,
            new URLSearchParams({
                client_id: settings.client_id,
                client_secret: settings.client_secret,
                redirect_uri: settings.redirect_url,
                grant_type: "refresh_token",
                refresh_token: appConnection.refresh_token,
            }),
            {
                headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
            }
        )
    ).data;
    return { ...appConnection, ...formatOAuth2Response(response) };
}

function formatOAuth2Response(response: Record<string, any>) {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const formattedResponse: BaseOAuth2ConnectionValue = {
        access_token: response["access_token"],
        expires_in: response["expires_in"],
        claimed_at: secondsSinceEpoch,
        refresh_token: response["refresh_token"],
        scope: response["scope"],
        token_type: response["token_type"],
        data: response,
    };
    deleteProps(formattedResponse.data, ['access_token', "access_token", "expires_in", "refresh_token", "scope", "token_type"]);
    return formattedResponse;
}

function deleteProps(obj: Record<string, any>, prop: string[]) {
    for (const p of prop) {
        delete obj[p];
    }
}
