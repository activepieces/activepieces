import {EntitySchema} from "typeorm"
import {Collection, Project, User} from "shared/dist";
import {BaseColumnSchemaPart} from "./base-entity";

interface ProjectSchema extends Project {
    owner: User;
    collections: Collection[]
}

export const ProjectEntity = new EntitySchema<ProjectSchema>({
    name: "project",
    columns: {
        ...BaseColumnSchemaPart,
        ownerId: {
            type: 'bytea',
        },
        displayName: {
            type: String
        }
    },
    indices: [
        {
            name: 'idx_project_owner_id',
            columns: ['ownerId'],
            unique: false
        }
    ],
    relations: {
        owner: {
            type: 'many-to-one',
            target: 'user',
            joinColumn: {
                name: 'ownerId',
                foreignKeyConstraintName: "fk_project_owner_id",
            },
        },
        collections: {
            type: "one-to-many",
            target: "collection",
            inverseSide: 'project'
        },
    }
})
