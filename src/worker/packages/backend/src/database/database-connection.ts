import {DataSource} from 'typeorm';
import {UserEntity} from '../user/user-entity';
import {ProjectEntity} from "../project/project-entity";
import {CollectionVersionEntity} from "../collections/collection-version/collection-version-entity";
import {CollectionEntity} from "../collections/collection-entity";
import {FlowEntity} from "../flows/flow-entity";
import {FlowVersionEntity} from "../flows/flow-version/flow-version-entity";
import {FileEntity} from "../file/file-entity";
import {StoreEntryEntity} from "../store-entry/store-entry-entity";
import {InstanceEntity} from '../instance/instance-entity';
import { InstanceRunEntity } from '../instance-run/instance-run-entity';
import {FlagEntity} from "../flags/flag-entity";

export const databaseConnection = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 7432,
    username: 'postgres',
    password: 'A79Vm5D4p2VQHOp2gd5',
    database: 'activepieces',
    synchronize: true,
    entities: [
        CollectionEntity,
        CollectionVersionEntity,
        FileEntity,
        FlagEntity,
        FlowEntity,
        FlowVersionEntity,
        InstanceEntity,
        InstanceRunEntity,
        ProjectEntity,
        StoreEntryEntity,
        UserEntity,
    ],
});
