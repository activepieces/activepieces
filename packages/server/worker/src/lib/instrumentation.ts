import { Context, Span } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { system, WorkerSystemProp } from './config/configs'

const ATTRIBUTES_TO_DROP = ['db.statement']

class FilteringSpanProcessor implements SpanProcessor {
    constructor(private readonly delegate: BatchSpanProcessor) {}

    onStart(span: Span, parentContext: Context): void {
        this.delegate.onStart(span, parentContext)
    }

    onEnd(span: ReadableSpan): void {
        for (const attr of ATTRIBUTES_TO_DROP) {
            Reflect.deleteProperty(span.attributes, attr)
        }
        this.delegate.onEnd(span)
    }

    shutdown(): Promise<void> {
        return this.delegate.shutdown()
    }

    forceFlush(): Promise<void> {
        return this.delegate.forceFlush()
    }
}

if (system.getBoolean(WorkerSystemProp.OTEL_ENABLED)) {
    const traceExporter = new OTLPTraceExporter()

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'activepieces-worker',
    })

    const sdk = new NodeSDK({
        spanProcessors: [new FilteringSpanProcessor(new BatchSpanProcessor(traceExporter))],
        resource,
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-dns': { enabled: false },
                '@opentelemetry/instrumentation-net': { enabled: false },
            }),
        ],
    })

    sdk.start()
}
