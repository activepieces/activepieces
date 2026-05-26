import dayjs from 'dayjs'
import { isNil } from '../../../core/common'
import { FlowAction, FlowActionType, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { UpdateActionRequest } from './index'

function _updateAction(flowVersion: FlowVersion, request: UpdateActionRequest): FlowVersion {
    const next = flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.name) {
            return stepToUpdate
        }

        const baseProps: Omit<FlowAction, 'type'> = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            skip: request.skip,
            lastUpdatedDate: dayjs().toISOString(),
            settings: {
                ...stepToUpdate.settings,
                customLogoUrl: request.settings.customLogoUrl,
            },
        }


        let updatedAction: FlowAction
        switch (request.type) {
            case FlowActionType.CODE: {
                const existingSampleData = stepToUpdate.type === FlowActionType.CODE ? stepToUpdate.settings.sampleData : undefined
                updatedAction = {
                    ...baseProps,
                    settings: { ...request.settings, sampleData: existingSampleData },
                    type: FlowActionType.CODE,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
            case FlowActionType.PIECE: {
                const existingSampleData = stepToUpdate.type === FlowActionType.PIECE ? stepToUpdate.settings.sampleData : undefined
                updatedAction = {
                    ...baseProps,
                    settings: { ...request.settings, sampleData: existingSampleData },
                    type: FlowActionType.PIECE,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }
            case FlowActionType.LOOP_ON_ITEMS: {
                const existingSampleData = stepToUpdate.type === FlowActionType.LOOP_ON_ITEMS ? stepToUpdate.settings.sampleData : undefined
                const firstLoopAction = stepToUpdate.type === FlowActionType.LOOP_ON_ITEMS ? stepToUpdate.firstLoopAction : undefined
                updatedAction = {
                    ...baseProps,
                    settings: { ...request.settings, sampleData: existingSampleData },
                    type: FlowActionType.LOOP_ON_ITEMS,
                    firstLoopAction,
                    nextAction: stepToUpdate.nextAction,
                }
                break
            }

            case FlowActionType.ROUTER: {
                const existingSampleData = stepToUpdate.type === FlowActionType.ROUTER ? stepToUpdate.settings.sampleData : undefined
                const children = stepToUpdate.type === FlowActionType.ROUTER ? stepToUpdate.children : [null, null]
                updatedAction = {
                    ...baseProps,
                    settings: { ...request.settings, sampleData: existingSampleData },
                    type: FlowActionType.ROUTER,
                    nextAction: stepToUpdate.nextAction,
                    children,
                }
                break
            }
        }
        const parseResult = SingleActionSchema.safeParse(updatedAction)
        const valid = (isNil(request.valid) ? true : request.valid) && parseResult.success
        return {
            ...updatedAction,
            valid,
        }
    })
    return next
}

export { _updateAction }
