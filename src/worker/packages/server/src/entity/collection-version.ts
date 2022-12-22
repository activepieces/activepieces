import {EntitySchema} from "typeorm"
import {Collection, CollectionVersion, Project} from "shared/dist";
import {BaseColumnSchemaPart} from "./base-entity";

interface CollectionVersionSchema extends CollectionVersion {
    collection: Collection;
}

export const CollectionVersionEntity = new EntitySchema<CollectionVersionSchema>({
    name: "collection",
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String,
        },
        collectionId: {
            type: 'bytea',
        },
        configs: {
            type: 'jsonb',
        },
        state: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_collection_version_collection_id',
            columns: ['collectionId'],
            unique: false
        }
    ],
    relations: {
        collection: {
            type: 'many-to-one',
            target: 'collection',
            joinColumn: {
                name: 'collectionId',
                foreignKeyConstraintName: "fk_collection_version_collection_id"
            },
        },
    }
})
