import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { logs, NodeSDK } from '@opentelemetry/sdk-node'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'activepieces',
    [ATTR_SERVICE_VERSION]: '1.0.0',
})

const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
        url: 'http://localhost:4317/v1/traces',
    }),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
            url: 'http://localhost:4317/v1/metrics',
        }),
    }),
    logRecordProcessor: new logs.BatchLogRecordProcessor(
        new OTLPLogExporter({
            url: 'http://localhost:4317/v1/logs',
        }),
    ),
    instrumentations: [getNodeAutoInstrumentations()],
    resource,
})

sdk.start()
