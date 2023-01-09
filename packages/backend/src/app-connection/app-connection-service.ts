import { apId, AppConnection, AppConnectionId, AppCredential, AppCredentialId, AppSecretType, Cursor, OAuth2Response, OAuth2Settings, RefreshTokenFromCloudRequest, SeekPage, UpsertConnectionRequest } from "shared";
import { databaseConnection } from "../database/database-connection";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { AppConnectionEntity } from "./app-connection-entity";
import axios, { AxiosError } from "axios";
import qs from "qs";
import { appCredentialService } from "../app-credential/app-credential-service";

const appConnectionRepo = databaseConnection.getRepository(AppConnectionEntity);

export const appConnectionService = {
    async upsert(request: UpsertConnectionRequest): Promise<AppConnection> {
        await appConnectionRepo.upsert({ ...request, id: apId() }, ["name", "appCredentialId"]);
        return appConnectionRepo.findOneByOrFail({
            name: request.name,
            appCredentialId: request.appCredentialId
        })
    },
    async getOne(id: AppConnectionId): Promise<AppConnection | null> {
        return appConnectionRepo.findOneBy({
            id: id
        })
    },
    async delete(id: AppConnectionId): Promise<void> {
        await appConnectionRepo.delete({ id: id });
    },
    async list(credentialId: AppCredentialId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<AppConnection>> {
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
        const queryBuilder = appConnectionRepo.createQueryBuilder("app_connection").where({ appSeceretId: credentialId });
        const { data, cursor } = await paginator.paginate(queryBuilder.where({ appSeceretId: credentialId }));
        return paginationHelper.createPage<AppConnection>(data, cursor);
    }
};

// TODO USE
async function refresh(connection: AppConnection): Promise<AppConnection> {
    const appCredential = await appCredentialService.getOneOrThrow(connection.appCredentialId);
    switch (appCredential.type) {
        case AppSecretType.CLOUD_OAUTH2:
            connection.connection = await refreshCloud(appCredential, connection.connection as OAuth2Response);
            break;
        case AppSecretType.OAUTH2:
            connection.connection = await refreshWithCredentials(appCredential, connection.connection as OAuth2Response);
            break;
        default:
            break;
    }
    return connection;
}


async function refreshCloud(appCredential: AppCredential, connection: OAuth2Response): Promise<OAuth2Response> {
    return (
        await axios.post("https://secrets.activepieces.com/refresh", {
            refreshToken: connection.refresh_token,
            pieceName: appCredential.name,
        } as RefreshTokenFromCloudRequest)
    ).data;
}

async function refreshWithCredentials(appCredential: AppCredential, connection: OAuth2Response): Promise<OAuth2Response> {
    try {
        let settings = appCredential.settings as OAuth2Settings;
        let response = (
            await axios.post(
                settings.tokenUrl,
                qs.stringify({
                    client_id: settings.clientId,
                    client_secret: settings.clientSecret,
                    redirect_uri: settings.redirectUrl,
                    grant_type: "refresh_token",
                    refresh_token: connection.refresh_token,
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

/** 
async function refreshAndUpdateCollection(collectionVersion: Readonly<CollectionVersion>): Promise<CollectionVersion> {
    let clonedVersion: CollectionVersion = JSON.parse(JSON.stringify(collectionVersion));
    let refreshedConfigs = false;
    for (let i = 0; i < clonedVersion.configs.length; ++i) {
      let config = clonedVersion.configs[i];
      if (config.type === ConfigType.CLOUD_OAUTH2 || config.type == ConfigType.OAUTH2) {
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        if (config.value.expires_in === undefined || config.value.refresh_token === undefined) continue;
        // Refresh if there is less than 15 minutes to expire
        if (config.value.claimed_at + config.value.expires_in + 15 * 60 <= secondsSinceEpoch) {
          refreshedConfigs = true;
          try {
            let response = await oauth2Service.refresh(config);
            config.value = response;
          } catch (e) {
            console.error(e);
            /// There is nothing to do other than wait for the 3P service code to work in next 15 minutes, and throw an error.
          }
        }
      }
    }
    if (refreshedConfigs) {
      await collectionVersionService.updateVersion(clonedVersion.id, clonedVersion);
    }
    return clonedVersion;
  }**/