import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { system, WorkerSystemProp } from './config/configs'

if (system.get(WorkerSystemProp.OTEL_ENABLED)) {
    const traceExporter = new OTLPTraceExporter()

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'activepieces-worker',
    })

    const sdk = new NodeSDK({
        spanProcessors: [new BatchSpanProcessor(traceExporter)],
        resource,
        instrumentations: [
            getNodeAutoInstrumentations(),
        ],
    })

    sdk.start()
}
