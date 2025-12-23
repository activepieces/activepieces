import { Field } from '@activepieces/shared'
import {
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
const TARGET_ACTIONS = ['tables-create-records', 'tables-update-record']

function collectFieldIdsFromFlow(flowVersion: FlowVersion): Set<string> {
    const fieldIds = new Set<string>()

    flowStructureUtil.getAllSteps(flowVersion.trigger).forEach((step) => {
        if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== TABLES_PIECE_NAME || !step.settings.pieceVersion.startsWith('0.1.')) {
            return
        }
        const actionName = step.settings.actionName as string | undefined
        if (!actionName || !TARGET_ACTIONS.includes(actionName)) {
            return
        }

        const input = step.settings?.input as Record<string, unknown>
        const values = input?.values as Record<string, unknown> | undefined
        const fieldsValues = actionName === 'tables-create-records' ? values?.values as Record<string, unknown> | undefined : values
        if (!fieldsValues) {
            return
        }
        for (const fieldId of Object.keys(fieldsValues)) {
            fieldIds.add(fieldId)
        }
    })

    return fieldIds
}

export const migrateV11TablesToV2: Migration = {
    targetSchemaVersion: '11',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const fieldIds = collectFieldIdsFromFlow(flowVersion)

        if (fieldIds.size === 0) {
            return {
                ...flowVersion,
                schemaVersion: '12',
            }
        }

        const fields = await fieldRepo().find({
            where: { id: In([...fieldIds]) },
        })

        const fieldIdToExternalId = new Map<string, string>()
        for (const field of fields) {
            fieldIdToExternalId.set(field.id, field.externalId)
        }

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== TABLES_PIECE_NAME || !step.settings.pieceVersion.startsWith('0.1.')) {
                return step
            }

            const actionName = step.settings.actionName as string | undefined
            const input = step.settings?.input as Record<string, unknown>
            const values = input?.values as Record<string, unknown> | undefined
            const fieldsValue = actionName === 'tables-create-records' ? values?.values as Record<string, unknown> | undefined : values
            if (!actionName || !TARGET_ACTIONS.includes(actionName) || !fieldsValue) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion: '0.2.10',
                    },
                }
            }

            const newFieldsValue: Record<string, unknown> = {}
            for (const [fieldId, value] of Object.entries(fieldsValue)) {
                const externalId = fieldIdToExternalId.get(fieldId)
                if (externalId) {
                    newFieldsValue[externalId] = value
                } else {
                    // Keep the original key if field not found (might already be externalId)
                    newFieldsValue[fieldId] = value
                }
            }

            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: '0.2.10',
                    input: {
                        ...input,
                        values: actionName === 'tables-create-records' ? {
                            ...values,
                            values: newFieldsValue,
                        } : newFieldsValue,
                    },
                },
            }
        })

        return {
            ...newVersion,
            schemaVersion: '12',
        }
    },
}

