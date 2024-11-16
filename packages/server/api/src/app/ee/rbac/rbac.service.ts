import { ActivepiecesError, ApId, apId, CreateRbacRequestBody, ErrorCode, PlatformId, Rbac, SeekPage, spreadIfDefined, UpdateRbacRequestBody } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { RbacEntity } from './rbac.entity'


export const rbacRepo = repoFactory(RbacEntity)

export const rbacService = {

    async list(platformId: PlatformId): Promise<SeekPage<Rbac>> {
        const rbacs = await rbacRepo().find({
            where: { platformId },
            order: { updated: 'DESC' },
        })

        return {
            data: rbacs,
            next: null,
            previous: null,
        }
    },

    async create(params: CreateRbacRequestBody): Promise<Rbac> {
        const rbac = rbacRepo().create(params)
        rbac.id = apId()
        return rbacRepo().save(rbac)
    },

    async update(id: ApId, { name, permissions }: UpdateRbacRequestBody): Promise<Rbac> {
        const updateResult = await rbacRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('permissions', permissions),
        })

        if (updateResult.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'rbac',
                    entityId: id,
                },
            })
        }

        return rbacRepo().findOneByOrFail({ id })
    },

    async delete(id: ApId): Promise<void> {
        await rbacRepo().delete({ id })
    },
}
