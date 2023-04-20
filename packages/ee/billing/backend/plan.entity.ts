import { EntitySchema} from "typeorm";
import { Project } from "@activepieces/shared";
import { ApIdSchema, BaseColumnSchemaPart } from "@backend/helper/base-entity";
import { ProjectPlan } from "@activepieces/ee/shared";

export interface ProjectPlanSchema extends ProjectPlan {
    project: Project;
}

export const ProjectPlanEntity = new EntitySchema<ProjectPlanSchema>({
    name: "project_plan",
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        name: {
            type: String
        },
        stripeCustomerId: {
            type: String
        },
        stripeSubscriptionId: {
            type: String
        },
        tasks: {
            type: Number
        },
        subscriptionStartDatetime: {
            type: "timestamp with time zone",
        }
    },
    indices: [
        {
            name: "idx_plan_project_id",
            columns: ["projectId"],
            unique: true,
        },
        {
            name: "idx_plan_stripe_customer_id",
            columns: ["stripeCustomerId"],
            unique: true,
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
                foreignKeyConstraintName: "fk_project_plan_project_id",
            },
        }
    },
});
