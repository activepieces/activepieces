import { DestinationType, EventDestinationPreset } from '@activepieces/shared'

const envelopeAttributes = {
    eventId: '{{ id }}',
    event: '{{ action }}',
    created: '{{ created }}',
    platformId: '{{ platformId }}',
    projectId: '{{ projectId }}',
    projectDisplayName: '{{ projectDisplayName }}',
    userId: '{{ userId }}',
    userEmail: '{{ userEmail }}',
    ip: '{{ ip }}',
    data: '{{ data }}',
}

const epochNanoseconds = 'combine(to_epoch({{ created }});"000000")'

const lokiLogLine = 'combine({{ action }};to_json({{ data }});" ")'

export const destinationPresets: EventDestinationPreset[] = [
    {
        type: DestinationType.CUSTOM,
        label: 'Custom JSON',
        defaultHeaders: {},
        defaultMapper: null,
    },
    {
        type: DestinationType.LOKI,
        label: 'Grafana Loki',
        docsUrl: 'https://grafana.com/docs/loki/latest/reference/loki-http-api/#ingest-logs',
        defaultHeaders: { 'X-Scope-OrgID': '' },
        defaultMapper: {
            streams: [{
                stream: {
                    app: 'activepieces',
                    event: '{{ action }}',
                },
                values: [[epochNanoseconds, lokiLogLine]],
            }],
        },
    },
    {
        type: DestinationType.DATADOG,
        label: 'Datadog',
        docsUrl: 'https://docs.datadoghq.com/api/latest/logs/#send-logs',
        defaultHeaders: { 'DD-API-KEY': '' },
        defaultMapper: {
            ddsource: 'activepieces',
            service: 'activepieces',
            message: '{{ action }}',
            ...envelopeAttributes,
        },
    },
    {
        type: DestinationType.POSTHOG,
        label: 'PostHog',
        docsUrl: 'https://posthog.com/docs/api/capture',
        defaultHeaders: {},
        defaultMapper: {
            api_key: '',
            event: '{{ action }}',
            distinct_id: '{{ platformId }}',
            timestamp: '{{ created }}',
            properties: envelopeAttributes,
        },
    },
    {
        type: DestinationType.SPLUNK,
        label: 'Splunk HEC',
        docsUrl: 'https://docs.splunk.com/Documentation/Splunk/latest/Data/FormateventsforHTTPEventCollector',
        defaultHeaders: { Authorization: 'Splunk ' },
        defaultMapper: {
            time: 'to_epoch({{ created }};"s")',
            source: 'activepieces',
            sourcetype: '_json',
            event: envelopeAttributes,
        },
    },
    {
        type: DestinationType.ELASTICSEARCH,
        label: 'Elasticsearch',
        docsUrl: 'https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-index',
        defaultHeaders: { Authorization: 'ApiKey ' },
        defaultMapper: {
            '@timestamp': '{{ created }}',
            ...envelopeAttributes,
        },
    },
    {
        type: DestinationType.SUMO_LOGIC,
        label: 'Sumo Logic',
        docsUrl: 'https://help.sumologic.com/docs/send-data/hosted-collectors/http-source/logs-metrics/upload-logs/',
        defaultHeaders: {},
        defaultMapper: {
            timestamp: '{{ created }}',
            ...envelopeAttributes,
        },
    },
    {
        type: DestinationType.NEW_RELIC,
        label: 'New Relic Logs',
        docsUrl: 'https://docs.newrelic.com/docs/logs/log-api/introduction-log-api/',
        defaultHeaders: { 'Api-Key': '' },
        defaultMapper: {
            timestamp: 'to_epoch({{ created }})',
            message: '{{ action }}',
            attributes: envelopeAttributes,
        },
    },
    {
        type: DestinationType.AXIOM,
        label: 'Axiom',
        docsUrl: 'https://axiom.co/docs/restapi/ingest',
        defaultHeaders: { Authorization: 'Bearer ' },
        defaultMapper: {
            _time: '{{ created }}',
            ...envelopeAttributes,
        },
    },
    {
        type: DestinationType.BETTER_STACK,
        label: 'Better Stack',
        docsUrl: 'https://betterstack.com/docs/logs/http-rest-api/',
        defaultHeaders: { Authorization: 'Bearer ' },
        defaultMapper: {
            dt: '{{ created }}',
            message: '{{ action }}',
            ...envelopeAttributes,
        },
    },
]
