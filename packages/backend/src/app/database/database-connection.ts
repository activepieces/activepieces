import { TlsOptions } from "node:tls";
import { DataSource } from "typeorm";
import { UserEntity } from "../user/user-entity";
import { ProjectEntity } from "../project/project.entity";
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
import { ProjectPlanEntity } from "@ee/billing/backend/plan.entity";
import { ProjectUsageEntity } from "@ee/billing/backend/usage.entity";
import { billing1677286751592 } from "./migration/1677286751592-billing";
import { addVersionToPieceSteps1677521257188 } from "./migration/1677521257188-add-version-to-piece-steps";
import { productEmbed1677894800372 } from "./migration/1677894800372-product-embed";
import { AppCredentialEntity } from "@ee/product-embed/backend/app-credentials/app-credentials.entity";
import { ConnectionKeyEntity } from "@ee/product-embed/backend/connection-keys/connection-key.entity";
import { removeCollectionVersion1678492809093 } from "./migration/1678492809093-removeCollectionVersion";

const database = system.getOrThrow(SystemProp.POSTGRES_DATABASE);
const host = system.getOrThrow(SystemProp.POSTGRES_HOST);
const password = system.getOrThrow(SystemProp.POSTGRES_PASSWORD);
const serializedPort = system.getOrThrow(SystemProp.POSTGRES_PORT);
const port = Number.parseInt(serializedPort, 10);
const username = system.getOrThrow(SystemProp.POSTGRES_USERNAME);

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
    return [
        FlowAndFileProjectId1674788714498,
        initializeSchema1676238396411,
        encryptCredentials1676505294811,
        removeStoreAction1676649852890,
        billing1677286751592,
        addVersionToPieceSteps1677521257188,
        productEmbed1677894800372,
        removeCollectionVersion1678492809093
    ];
}

export const databaseConnection = new DataSource({
    type: "postgres",
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    subscribers: [],
    migrationsRun: true,
    migrationsTransactionMode: 'each',
    ssl: getSslConfig(),
    migrations: getMigrations(),
    entities: [
        AppCredentialEntity,
        ConnectionKeyEntity,
        CollectionEntity,
        FileEntity,
        FlagEntity,
        FlowEntity,
        FlowVersionEntity,
        InstanceEntity,
        FlowRunEntity,
        ProjectEntity,
        StoreEntryEntity,
        UserEntity,
        AppConnectionEntity,
        ProjectPlanEntity,
        ProjectUsageEntity
    ],
});
