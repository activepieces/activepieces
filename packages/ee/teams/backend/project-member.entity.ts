import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from "@backend/helper/base-entity";
import { ProjectMember } from '../shared/project-member';

export type ProjectMemberSchema = ProjectMember;

export const ProjectMemberEntity = new EntitySchema<ProjectMemberSchema>({
    name: 'project_member',
    columns: {
        ...BaseColumnSchemaPart,
        userId: ApIdSchema,
        projectId: ApIdSchema,
        role: {
            type: String,
        },
        status: {
            type: String,
        }
    },
    indices: [
        {
            name: 'idx_project_member_project_id_user_id',
            columns: ['projectId', 'userId'],
            unique: true,
        }
    ],
    relations: {

    },
})
