import { AppSystemProp } from '@activepieces/server-shared'
import { FastifyOtelInstrumentation } from '@fastify/otel'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
// import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
// import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
// import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { system } from './app/helper/system/system'

function getServiceName(): string {
    const isApp = system.isApp()
    const serviceName = isApp ? 'activepieces-api' : 'activepieces-worker'

    return serviceName
}

if (system.get(AppSystemProp.OTEL_ENABLED)) {
    // Temporarily disabled until OpenTelemetry dependencies are installed
    // const traceExporter = new OTLPTraceExporter()

    // Creating a resource to identify your service in traces
    // const resource = resourceFromAttributes({
    //     [ATTR_SERVICE_NAME]: getServiceName(),
    // })

    // Configuring the OpenTelemetry Node SDK
    const sdk = new NodeSDK({
        // Adding a BatchSpanProcessor to batch and send traces
        // spanProcessor: new BatchSpanProcessor(traceExporter),

        // Registering the resource to the SDK
        // resource,

        // Adding auto-instrumentations to automatically collect trace data
        instrumentations: [
            getNodeAutoInstrumentations(),
            new FastifyOtelInstrumentation({
                servername: getServiceName(),
                registerOnInitialization: true,
            }),
        ],
    })

    // Starting the OpenTelemetry SDK to begin collecting telemetry data
    sdk.start()
}
