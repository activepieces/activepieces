import {EntitySchema} from "typeorm"
import {Collection, CollectionVersion, Project} from "shared";
import {BaseColumnSchemaPart} from "../entity/base-entity";

interface CollectionSchema extends Collection {
    project: Project;
    versions: CollectionVersion[];
}

export const CollectionEntity = new EntitySchema<CollectionSchema>({
    name: "collection",
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            type: 'bytea',
        },
    },
    indices: [
        {
            name: 'idx_collection_project_id',
            columns: ['projectId'],
            unique: false
        }
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: "fk_collection_project_id",
            },
        },
        versions: {
            type: "one-to-many",
            target: "collection_version",
            inverseSide: 'collection'
        },
    }
})
