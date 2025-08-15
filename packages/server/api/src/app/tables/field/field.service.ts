import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, apId, CreateFieldRequest, ErrorCode, Field, isNil, UpdateFieldRequest } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { FieldEntity } from './field.entity'
import { FindOptionsWhere, UpdateResult } from 'typeorm'

const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ request, projectId }: CreateParams): Promise<Field> {
        await this.validateCount({ projectId, tableId: request.tableId })
        const count = await this.count({projectId, tableId: request.tableId})

        const field = await fieldRepo().save({
            ...request,
            projectId,
            id: apId(),
            externalId: request.externalId ?? apId(),
            index: count,
        })

        return field
    },

    async getAll({ projectId, tableId }: GetAllParams): Promise<Field[]> {
        return fieldRepo().find({
            where: { projectId, tableId },
            order: {
                index: 'ASC',
            },
        })
    },

    async getById({ id, projectId }: GetByIdParams): Promise<Field> {
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

    async delete({ id, projectId }: DeleteParams): Promise<void> {
        await fieldRepo().delete({
            id,
            projectId,
        })
    },

    async update({ id, projectId, request }: UpdateParams): Promise<Field> {
        await fieldRepo().update({
            id,
            projectId,
        }, {
            name: request.name,
        })
        return this.getById({ id, projectId })
    },

    async swapIndexes({activeIndex, overIndex, tableId, projectId}: SwapIndexesParams): Promise<Array<Field | null>>{
        const activeOptions: FindOptionsWhere<Field> = {projectId, tableId, index: activeIndex};
        const overOptions: FindOptionsWhere<Field> = {projectId, tableId, index: overIndex};

        const activeCount = await fieldRepo().count({where: activeOptions});
        const overCount = await fieldRepo().count({where: overOptions});

        if(activeCount !== 1 || overCount !== 1){
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Invalid index provided' }
            })
        }


        const tempIndex = -1;
        await fieldRepo().update(activeOptions, {index: tempIndex});
        await fieldRepo().update(overOptions, {index: activeIndex});
        await fieldRepo().update({...activeOptions, index: tempIndex}, {index: overIndex});

        return Promise.all([
            await fieldRepo().findOne({where: activeOptions}),
            await fieldRepo().findOne({where: overOptions})
        ])
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        return fieldRepo().count({
            where: { projectId, tableId },
        })
    },
    async validateCount(params: CountParams): Promise<void> {
        const countRes = await this.count(params)
        if (countRes + 1 > system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Max fields per table reached: ${system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)}`,
                },
            })
        }
    },
}

type CreateParams = {
    projectId: string
    request: CreateFieldRequest
}

type GetAllParams = {
    projectId: string
    tableId: string
}

type GetByIdParams = {
    id: string
    projectId: string
}

type DeleteParams = {
    id: string
    projectId: string
}

type UpdateParams = {
    id: string
    projectId: string
    request: UpdateFieldRequest
}

type CountParams = {
    projectId: string
    tableId: string
}

type SwapIndexesParams = {
    activeIndex: number
    overIndex: number
    projectId: string
    tableId: string
}
