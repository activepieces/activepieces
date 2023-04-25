import { EntitySchema} from "typeorm";
import { Project } from "@activepieces/shared";
import { ApIdSchema, BaseColumnSchemaPart } from "@backend/helper/base-entity";
import { ProjectUsage } from "@activepieces/ee/shared";

export interface ProjectUsageSchema extends ProjectUsage {
    project: Project;
}

export const ProjectUsageEntity = new EntitySchema<ProjectUsageSchema>({
    name: "project_usage",
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        consumedTasks: {
            type: Number
        },
        nextResetDatetime: {
            type: "timestamp with time zone",
        }
    },
    indices: [
        {
            name: "idx_project_usage_project_id",
            columns: ["projectId"],
            unique: false,
        }
    ],
    relations: {
        project: {
            type: "one-to-one",
            target: "project",
            cascade: true,
            onDelete: "CASCADE",
            joinColumn: {
                name: "projectId",
                referencedColumnName: "id",
                foreignKeyConstraintName: "fk_project_usage_project_id",
            },
        }
    },
});
