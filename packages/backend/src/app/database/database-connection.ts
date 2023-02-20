import { TlsOptions } from "node:tls";
import { DataSource } from "typeorm";
import { UserEntity } from "../user/user-entity";
import { ProjectEntity } from "../project/project.entity";
import { CollectionVersionEntity } from "../collections/collection-version/collection-version-entity";
import { CollectionEntity } from "../collections/collection.entity";
import { FlowEntity } from "../flows/flow.entity";
import { FlowVersionEntity } from "../flows/flow-version/flow-version-entity";
import { FileEntity } from "../file/file.entity";
import { StoreEntryEntity } from "../store-entry/store-entry-entity";
import { InstanceEntity } from "../instance/instance.entity";
import { FlowRunEntity } from "../flow-run/flow-run-entity";
import { FlagEntity } from "../flags/flag.entity";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";
import { AppConnectionEntity } from "../app-connection/app-connection.entity";
import { FlowAndFileProjectId1674788714498 } from "./migration/1674788714498-FlowAndFileProjectId";
import { initializeSchema1676238396411 } from "./migration/1676238396411-initialize-schema";
import { removeStoreAction1676649852890 } from "./migration/1676649852890-remove-store-action";
import { encryptCredentials1676505294811 } from "./migration/1676505294811-encrypt-credentials";

const env = system.get(SystemProp.ENVIRONMENT);
const database = system.getOrThrow(SystemProp.POSTGRES_DATABASE);
const host = system.getOrThrow(SystemProp.POSTGRES_HOST);
const password = system.getOrThrow(SystemProp.POSTGRES_PASSWORD);
const serializedPort = system.getOrThrow(SystemProp.POSTGRES_PORT);
const port = Number.parseInt(serializedPort, 10);
const username = system.getOrThrow(SystemProp.POSTGRES_USERNAME);

const getSyncConfig = (): boolean => {
    if (env === 'prod') {
        return false;
    }

    return true;
}

const getSslConfig = (): boolean | TlsOptions => {
    const useSsl = system.get(SystemProp.POSTGRES_USE_SSL);

    if (useSsl === 'true') {
        return {
            ca: system.get(SystemProp.POSTGRES_SSL_CA),
        }
    }

    return false;
}

const getMigrations = () => {
    const dataMigration = [removeStoreAction1676649852890, encryptCredentials1676505294811];
    if (env === 'prod') {
        return [
            FlowAndFileProjectId1674788714498,
            initializeSchema1676238396411,
            removeStoreAction1676649852890,
            encryptCredentials1676505294811
        ];
    }
    // These are data migrations, no schema is changed
    return [removeStoreAction1676649852890, encryptCredentials1676505294811];
}

export const databaseConnection = new DataSource({
    type: "postgres",
    host,
    port,
    username,
    password,
    database,
    synchronize: getSyncConfig(),
    subscribers: [],
    ssl: getSslConfig(),
    migrations: getMigrations(),
    entities: [
        CollectionEntity,
        CollectionVersionEntity,
        FileEntity,
        FlagEntity,
        FlowEntity,
        FlowVersionEntity,
        InstanceEntity,
        FlowRunEntity,
        ProjectEntity,
        StoreEntryEntity,
        UserEntity,
        AppConnectionEntity
    ],
});
