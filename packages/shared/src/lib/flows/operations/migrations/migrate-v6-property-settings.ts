import { FlowActionType } from '../../actions/action'
import { FlowVersion } from '../../flow-version'
import { PropertyExecutionType } from '../../properties'
import { flowStructureUtil } from '../../util/flow-structure-util'
import { Migration } from '.'

export const migratePropertySettingsV6: Migration = {
    targetSchemaVersion: '6',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const input = step.settings.input
            if (step.type === FlowActionType.PIECE) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        propertySettings: Object.fromEntries(Object.entries(input).map(([key]) => [key, {
                            type: PropertyExecutionType.MANUAL,
                            schema: undefined,
                        }])),
                    },
                }
            }
            return step
        })
        
        return {
            ...newVersion,
            schemaVersion: '7',
        }
    },
}