import { isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion, GenericStepOutput, LoopStepOutput, RouterStepOutput, StepOutputStatus } from '@activepieces/shared'
import { pieceLoader } from '../../helper/piece-loader'
import { utils } from '../../utils'
import { createPropsResolver } from '../../variables/props-resolver'
import { EngineConstants } from './engine-constants'
import { FlowExecutorContext } from './flow-execution-context'

export const testExecutionContext = {
    async stateFromFlowVersion({
        flowVersion,
        excludedStepName,
        projectId,
        engineToken,
        apiUrl,
        sampleData,
        engineConstants,
    }: TestExecutionParams): Promise<FlowExecutorContext> {
        let flowExecutionContext = FlowExecutorContext.empty({
            engineApi: { engineToken, internalApiUrl: apiUrl },
            slicingEnabled: false,
        })
        if (isNil(flowVersion)) {
            return flowExecutionContext
        }
        
        const flowSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)

        for (const step of flowSteps) {
            const { name } = step
            if (name === excludedStepName) {
                continue
            }

            const stepType = step.type
            switch (stepType) {
                case FlowActionType.ROUTER:
                    flowExecutionContext = await flowExecutionContext.upsertStep(
                        step.name,
                        RouterStepOutput.create({
                            input: step.settings,
                            type: stepType,
                            status: StepOutputStatus.SUCCEEDED,
                            ...spreadIfDefined('output', sampleData?.[step.name]),
                        }),
                    )
                    break
                case FlowActionType.LOOP_ON_ITEMS: {
                    const { resolvedInput } = await createPropsResolver({
                        apiUrl,
                        projectId,
                        engineToken,
                        contextVersion: LATEST_CONTEXT_VERSION,
                        stepNames: engineConstants.stepNames,
                    }).resolve<{ items: unknown[] }>({
                        unresolvedInput: step.settings,
                        executionState: flowExecutionContext,
                    })
                    flowExecutionContext = await flowExecutionContext.upsertStep(
                        step.name,
                        LoopStepOutput.init({
                            input: step.settings,
                        }).setOutput({
                            item: resolvedInput.items[0],
                            index: 1,
                            iterations: [],
                        }),
                    )
                    break
                }
                case FlowActionType.PIECE:
                case FlowActionType.CODE:
                case FlowTriggerType.EMPTY:
                case FlowTriggerType.PIECE: {
                    const stepSampleData = sampleData?.[step.name]
                    let seeded = GenericStepOutput.create({
                        input: {},
                        type: stepType,
                        status: StepOutputStatus.SUCCEEDED,
                        ...spreadIfDefined('output', stepSampleData),
                    })
                    // Seed the piece's sensitive output fields so a downstream step's
                    // censored input redacts them here too — a full run gets these from
                    // the executed step, but single-step tests seed prior steps from
                    // sample data, which carries no such marker.
                    if (step.type === FlowActionType.PIECE && !isNil(stepSampleData)) {
                        const { pieceName, pieceVersion, actionName } = step.settings
                        if (!isNil(actionName)) {
                            const { data } = await tryCatch(() => pieceLoader.getPieceAndActionOrThrow({
                                pieceName,
                                pieceVersion,
                                actionName,
                                devPieces: engineConstants.devPieces,
                            }))
                            const sensitiveFields = utils.sensitiveOutputFields(data?.pieceAction.outputSchema)
                            if (sensitiveFields.length > 0) {
                                seeded = seeded.setSensitiveOutputFields(sensitiveFields)
                            }
                        }
                    }
                    flowExecutionContext = await flowExecutionContext.upsertStep(step.name, seeded)
                    break
                }
            }
        }
        return flowExecutionContext
    },
}


type TestExecutionParams = {
    engineConstants: EngineConstants
    flowVersion?: FlowVersion
    excludedStepName?: string
    projectId: string
    apiUrl: string
    engineToken: string
    sampleData?: Record<string, unknown>
}