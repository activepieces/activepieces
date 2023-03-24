import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";
import { Collection, Flow, FlowRun, Project } from "@activepieces/shared";

interface FlowRunSchema extends FlowRun {
  project: Project;
  collection: Collection;
  flow: Flow;
}

export const FlowRunEntity = new EntitySchema<FlowRunSchema>({
    name: "flow_run",
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        collectionId: ApIdSchema,
        flowVersionId: ApIdSchema,
        environment: {
            type: String,
            nullable: true
        },
        flowDisplayName: {
            type: String,
        },
        collectionDisplayName: {
            type: String,
        },
        logsFileId: { ...ApIdSchema, nullable: true },
        status: {
            type: String,
        },
        startTime: {
            type: "timestamp with time zone",
        },
        finishTime: {
            nullable: true,
            type: "timestamp with time zone",
        },
    },
    indices: [
        {
            name: "idx_run_project_id",
            columns: ["projectId"],
            unique: false,
        }
    ],
    relations: {
        project: {
            type: "many-to-one",
            target: "project",
            cascade: true,
            onDelete: "CASCADE",
            joinColumn: {
                name: "projectId",
                foreignKeyConstraintName: "fk_flow_run_project_id",
            },
        },
        flow: {
            type: "many-to-one",
            target: "flow",
            cascade: true,
            onDelete: "CASCADE",
            joinColumn: {
                name: "flowId",
                foreignKeyConstraintName: "fk_flow_run_flow_id",
            },
        },
        collection: {
            type: "many-to-one",
            target: "collection",
            cascade: true,
            onDelete: "CASCADE",
            joinColumn: {
                name: "collectionId",
                foreignKeyConstraintName: "fk_flow_run_collection_id",
            },
        }
    },
});
