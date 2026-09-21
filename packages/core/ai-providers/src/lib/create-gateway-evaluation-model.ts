import { createGateway } from '@ai-sdk/gateway'
import { Experimental_EvaluationModelV4 } from '@ai-sdk/provider'

export function createGatewayEvaluationModel({ apiKey, modelId = GATEWAY_JEV_MODEL_ID }: CreateGatewayEvaluationModelParams): Experimental_EvaluationModelV4 {
    return createGateway({ apiKey }).evaluationModel(modelId)
}

export const GATEWAY_JEV_MODEL_ID = 'typesafe-ai/jev'

export type CreateGatewayEvaluationModelParams = {
    apiKey: string
    modelId?: string
}
