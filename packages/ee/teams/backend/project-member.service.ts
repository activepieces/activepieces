import { SendInvitationRequest } from '../shared/project-member-request';
import { ProjectMember, ProjectMemberId } from '../shared/project-member';
import { ProjectMemberEntity } from './project-member.entity';
import { apId, Cursor, ProjectId, SeekPage, AppConnection, UserId } from "@activepieces/shared";
import { buildPaginator } from "@backend/helper/pagination/build-paginator"
import { paginationHelper } from "@backend/helper/pagination/pagination-utils";
import { databaseConnection } from "@backend/database/database-connection";
import { ProjectMemberStatus } from "../shared/project-member";
import { userService } from '@/backend/src/app/user/user-service';
import { logger } from '@/backend/src/app/helper/logger';

const projectMemberrRepo = databaseConnection.getRepository(ProjectMemberEntity)

export const projectMemberService = {
    async send(projectId: ProjectId, { email, role }: SendInvitationRequest): Promise<ProjectMember | null> {
        const user = await userService.getByEmailOrCreateShadow({
            email: email
        })
        logger.info(`User ${user.id} invited to project ${projectId} with role ${role}`);
        const invitationId = apId();
        await projectMemberrRepo.upsert({
            id: invitationId,
            userId: user.id,
            projectId: projectId,
            role: role,
            status: ProjectMemberStatus.INVITATION_PENDING
        }, ['projectId', 'userId']);
        // TODO send email
        return projectMemberrRepo.findOneBy({ id: invitationId });
    },
    async list(projectId: ProjectId, cursorRequest: Cursor | null, limit: number | null): Promise<SeekPage<ProjectMember>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: ProjectMemberEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        let queryBuilder = projectMemberrRepo.createQueryBuilder('project_member').where({ projectId })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<ProjectMember>(data, cursor)
    },
    async listByUserId(userId: UserId): Promise<ProjectMember[] | null> {
        return projectMemberrRepo.find({
            where: {
                userId,
            }
        });
    },
    async delete(projectId: ProjectId, invitationId: ProjectMemberId): Promise<void> {
        await projectMemberrRepo.delete({ projectId, id: invitationId });
    }
}