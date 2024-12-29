import { ActivepiecesError, apId, CreateFieldRequest, ErrorCode, Field, isNil } from '@activepieces/shared'
import { MoreThanOrEqual } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { FieldEntity } from './field.entity'

const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ request, projectId }: { request: CreateFieldRequest, projectId: string } ): Promise<Field> {
        return transaction(async (entityManager) => {
            const repo = entityManager.getRepository(FieldEntity)
            let position = request.position
            if (isNil(position)) {
                const maxPositionField = await repo.findOne({
                    where: { projectId, tableId: request.tableId },
                    order: { position: 'DESC' },
                })
                position = maxPositionField ? maxPositionField.position + 1 : 0
            }
            else {
                // Shift all fields at or after the requested position
                await repo.increment(
                    {
                        projectId,
                        tableId: request.tableId,
                        position: MoreThanOrEqual(position),
                    },
                    'position',
                    1,
                )
            }
            const field = await repo.save({
                ...request,
                position,
                projectId,
                id: apId(),
            })
            return field
        })
    },

    async getAll({ projectId, tableId }: { projectId: string, tableId: string }): Promise<Field[]> {
        return fieldRepo().find({
            where: { projectId, tableId },
            order: { position: 'ASC' },
        })
    },

    async getById({ id, projectId }: { id: string, projectId: string }): Promise<Field> {
        const field = await fieldRepo().findOne({
            where: { id, projectId },
        })

        if (isNil(field)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Field',
                    entityId: id,
                },
            })
        }

        return field
    },

    async delete({ id, projectId }: { id: string, projectId: string }): Promise<void> {
        return transaction(async (entityManager) => {
            const repo = entityManager.getRepository(FieldEntity)
            const field = await repo.findOne({
                where: { id, projectId },
            })

            if (!field) {
                return
            }

            await repo.delete({
                id,
                projectId,
            })

            // Decrement position of all fields after the deleted one
            await repo.decrement(
                {
                    projectId,
                    tableId: field.tableId,
                    position: MoreThanOrEqual(field.position + 1),
                },
                'position',
                1,
            )
        })
    },
}