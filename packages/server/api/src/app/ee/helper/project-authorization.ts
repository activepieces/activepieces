import { ActivepiecesError, ErrorCode, ProjectId, UserId } from "@activepieces/shared";
import { projectMemberService } from "../projects/project-members/project-member.service";
import { FastifyBaseLogger } from "fastify";

export const projectMustBeAccessibleByCurrentUser = async (projectId: ProjectId, userId: UserId, log: FastifyBaseLogger): Promise<void> => {
    const projectMemberExists = await projectMemberService(log).exists({
        projectId,
        userId,
    })

    if (!projectMemberExists) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'user is not a member of the project',
            },
        })
    }
}