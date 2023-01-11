import { apId, AppConnection, AppConnectionId, AppConnectionType, CloudAuth2Connection, Cursor, OAuth2AppConnection, OAuth2Response, ProjectId, RefreshTokenFromCloudRequest, SeekPage, UpsertConnectionRequest } from "shared";
import { databaseConnection } from "../database/database-connection";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { AppConnectionEntity } from "./app-connection-entity";
import axios, { AxiosError } from "axios";
import qs from "qs";

const appConnectionRepo = databaseConnection.getRepository(AppConnectionEntity);

export const appConnectionService = {
    async upsert(request: UpsertConnectionRequest): Promise<AppConnection> {
        await appConnectionRepo.upsert({ ...request, id: apId() }, ["name", "appName", "projectId"]);
        return appConnectionRepo.findOneByOrFail({
            name: request.name,
            appName: request.appName
        })
    },
    async getOne(id: AppConnectionId): Promise<AppConnection | null> {
        const appConnection = await appConnectionRepo.findOneBy({
            id: id
        });
        if (appConnection === null) {
            return null;
        }
        const refreshedAppConnection = await refresh(appConnection);
        await appConnectionRepo.update(id, refreshedAppConnection);
        return refreshedAppConnection;
    },
    async delete(id: AppConnectionId): Promise<void> {
        await appConnectionRepo.delete({ id: id });
    },
    async list(projectId: ProjectId, appName: string | undefined, name: string | undefined, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppConnection>> {
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
        if (name !== undefined) {
            queryBuilder = queryBuilder.where({ name });
        }
        if (appName !== undefined) {
            queryBuilder = queryBuilder.where({ appName });
        }
        const { data, cursor } = await paginator.paginate(queryBuilder);

        return paginationHelper.createPage<AppConnection>(data, cursor);
    }
};

async function refresh(connection: AppConnection): Promise<AppConnection> {
    switch (connection.type) {
        case AppConnectionType.CLOUD_OAUTH2:
            connection.connection = await refreshCloud(connection);
            break;
        case AppConnectionType.OAUTH2:
            connection.connection = await refreshWithCredentials(connection);
            break;
        default:
            break;
    }
    return connection;
}

function expired(connection: OAuth2Response) {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    if (connection.expires_in === undefined || connection.refresh_token === undefined) {
        return false;
    }
    // Refresh if there is less than 15 minutes to expire
    return (connection.claimed_at + connection.expires_in + 15 * 60 <= secondsSinceEpoch)
}

async function refreshCloud(appConnection: CloudAuth2Connection): Promise<OAuth2Response> {
    if (!expired(appConnection.connection)) {
        return appConnection.connection;
    }
    return (
        await axios.post("https://secrets.activepieces.com/refresh", {
            refreshToken: appConnection.connection.refresh_token,
            pieceName: appConnection.appName,
        } as RefreshTokenFromCloudRequest)
    ).data;
}

async function refreshWithCredentials(appConnection: OAuth2AppConnection): Promise<OAuth2Response> {
    if (!expired(appConnection.connection)) {
        return appConnection.connection;
    }
    try {
        let settings = appConnection.settings;
        let response = (
            await axios.post(
                settings.tokenUrl,
                qs.stringify({
                    client_id: settings.clientId,
                    client_secret: settings.clientSecret,
                    redirect_uri: settings.redirectUrl,
                    grant_type: "refresh_token",
                    refresh_token: appConnection.connection.refresh_token,
                }),
                {
                    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
                }
            )
        ).data;
        return formatOAuth2Response(response);
    } catch (e: unknown | AxiosError) {
        throw e;
    }
}

function formatOAuth2Response(response: Record<string, any>) {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    let formattedResponse: OAuth2Response = {
        access_token: response["access_token"],
        expires_in: response["expires_in"],
        claimed_at: secondsSinceEpoch,
        refresh_token: response["refresh_token"],
        scope: response["scope"],
        token_type: response["token_type"],
        data: response,
    };
    delete formattedResponse.data["access_token"];
    delete formattedResponse.data["expires_in"];
    delete formattedResponse.data["refresh_token"];
    delete formattedResponse.data["scope"];
    delete formattedResponse.data["token_type"];
    return formattedResponse;
}

