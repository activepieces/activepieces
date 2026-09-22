import { formulaEvaluator } from '@activepieces/core-formula'
import { applyFunctionToValuesSync, isNil } from '@activepieces/core-utils'
import { ApplicationEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

export function renderEventBody({ mapper, event, destinationId, log }: RenderEventBodyParams): unknown {
    if (isNil(mapper)) {
        return event
    }
    return applyFunctionToValuesSync<unknown>(mapper, (expression) => {
        const { result, error } = formulaEvaluator.evaluate({
            expression: asFormulaWhenWholeLeafIsOneExpression(expression),
            sampleData: event,
        })
        if (!isNil(error)) {
            log.warn({
                destination: { id: destinationId },
                action: event.action,
                expression,
                mapperError: error,
            }, '[renderEventBody] A payload template expression failed to render; the destination receives null in its place')
        }
        return result
    })
}

function asFormulaWhenWholeLeafIsOneExpression(expression: string): string {
    if (formulaEvaluator.containsWrapper(expression)) {
        return expression
    }
    if (!formulaEvaluator.isSingleExpression(expression)) {
        return expression
    }
    return formulaEvaluator.wrap(expression)
}

type RenderEventBodyParams = {
    mapper: unknown
    event: ApplicationEvent
    destinationId?: string
    log: Pick<FastifyBaseLogger, 'warn'>
}
