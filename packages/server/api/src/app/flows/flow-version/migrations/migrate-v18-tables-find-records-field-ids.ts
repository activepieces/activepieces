import {
    Field,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    Step,
} from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { FieldEntity } from '../../../tables/field/field.entity'
import { Migration } from '.'

const fieldRepo = repoFactory<Field>(FieldEntity)

const TABLES_PIECE_NAME = '@activepieces/piece-tables'
const TABLES_PIECE_VERSION = '0.3.0'
const FIND_RECORDS_ACTION = 'tables-find-records'

function collectFieldIdsFromFilters(flowVersion: FlowVersion): string[] {
    const fieldIds: string[] = []

    flowStructureUtil.getAllSteps(flowVersion.trigger).forEach((step) => {
        if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== TABLES_PIECE_NAME) {
            return
        }
        if (step.settings.actionName !== FIND_RECORDS_ACTION) {
            return
        }

        const input = step.settings?.input as Record<string, unknown> | undefined
        const filters = input?.filters as Record<string, unknown> | undefined
        const filtersArray = filters?.filters as { field?: { id?: string } }[] | undefined
        if (!Array.isArray(filtersArray)) {
            return
        }

        for (const filter of filtersArray) {
            if (filter.field?.id) {
                fieldIds.push(filter.field.id)
            }
        }
    })

    return fieldIds
}

export const migrateV18TablesFieldIds: Migration = {
    targetSchemaVersion: '18',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const fieldIds = collectFieldIdsFromFilters(flowVersion)
        if (fieldIds.length === 0) {
            return {
                ...flowVersion,
                schemaVersion: '19',
            }
        }

        const fields = await fieldRepo().find({
            where: { id: In([...new Set(fieldIds)]) },
        })

        const fieldIdToExternalId: Record<string, string> = {}
        for (const field of fields) {
            fieldIdToExternalId[field.id] = field.externalId
        }

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== TABLES_PIECE_NAME) {
                return step
            }

            if (step.settings.actionName !== FIND_RECORDS_ACTION) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: TABLES_PIECE_VERSION,
                    },
                }
            }

            const input = step.settings?.input as Record<string, unknown> | undefined
            const filters = input?.filters as Record<string, unknown> | undefined
            const filtersArray = filters?.filters as { field?: { id?: string, type?: string, name?: string } }[] | undefined
            if (!Array.isArray(filtersArray)) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: TABLES_PIECE_VERSION,
                    },
                }
            }

            const migratedFilters = filtersArray.map((filter) => {
                if (!filter.field?.id || !fieldIdToExternalId[filter.field.id]) {
                    return filter
                }
                return {
                    ...filter,
                    field: {
                        ...filter.field,
                        id: fieldIdToExternalId[filter.field.id],
                    },
                }
            })

            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: TABLES_PIECE_VERSION,
                    input: {
                        ...input,
                        filters: {
                            ...filters,
                            filters: migratedFilters,
                        },
                    },
                },
            }
        })

        return {
            ...newVersion,
            schemaVersion: '19',
        }
    },
}
