import {EntitySchema} from "typeorm"
import {Collection, CollectionVersion, Project} from "shared";
import {ApIdSchema, BaseColumnSchemaPart} from "../../helper/base-entity";

interface CollectionVersionSchema extends CollectionVersion {
    collection: Collection;
}

export const CollectionVersionEntity = new EntitySchema<CollectionVersionSchema>({
    name: "collection_version",
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String,
        },
        collectionId: ApIdSchema,
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
            cascade: true,
            onDelete: 'CASCADE',
            type: 'many-to-one',
            target: 'collection',
            joinColumn: {
                name: 'collectionId',
                foreignKeyConstraintName: "fk_collection_version_collection_id"
            },
        },
    }
})
