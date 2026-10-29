import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const MAX_METRICS = 5;
const { recordOf, str, num, arrayOf, isRecord } = posthogClient;

function variant(raw: unknown) {
  const v = recordOf(raw);
  return {
    key: str(v['key']),
    samples: num(v['number_of_samples']) ?? 0,
    sum: num(v['sum']),
    chanceToWin: num(v['chance_to_win']),
    significant: typeof v['significant'] === 'boolean' ? v['significant'] : null,
    credibleInterval: arrayOf(v['credible_interval'] ?? v['confidence_interval']).filter((n): n is number => typeof n === 'number'),
    pValue: num(v['p_value']),
    validationFailures: arrayOf(v['validation_failures']).filter((f): f is string => typeof f === 'string'),
  };
}

const variantFields: OutputSchemaField[] = [
  { key: 'key', label: 'Variant' },
  { key: 'samples', label: 'Exposures', format: 'number' },
  { key: 'sum', label: 'Metric Sum', format: 'number' },
  { key: 'chanceToWin', label: 'Chance to Win', format: 'number', description: 'Bayesian probability (0-1) this variant beats control.' },
  { key: 'significant', label: 'Significant', format: 'boolean' },
  { key: 'credibleInterval', label: 'Interval', description: 'Credible (Bayesian) or confidence (frequentist) interval of the change vs control.' },
  { key: 'pValue', label: 'p-value', format: 'number' },
  { key: 'validationFailures', label: 'Validation Failures', description: 'e.g. not-enough-exposures.' },
];

const resultsSchema: OutputSchema = {
  fields: [
    { key: 'experimentId', label: 'Experiment ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'featureFlagKey', label: 'Feature Flag Key' },
    { key: 'startDate', label: 'Start Date', format: 'datetime' },
    { key: 'endDate', label: 'End Date', format: 'datetime' },
    {
      key: 'metrics',
      label: 'Metrics',
      labelKey: 'name',
      listItems: [
        { key: 'uuid', label: 'Metric UUID' },
        { key: 'name', label: 'Metric' },
        { key: 'metricType', label: 'Metric Type' },
        { key: 'error', label: 'Error' },
        { key: 'control', label: 'Control', children: variantFields },
        { key: 'variants', label: 'Test Variants', labelKey: 'key', listItems: variantFields },
      ],
    },
    { key: 'totalMetrics', label: 'Primary Metrics', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean', description: `True when the experiment has more than ${MAX_METRICS} primary metrics; only the first ${MAX_METRICS} are computed.` },
  ],
};

export const getExperimentResults = createAction({
  auth: posthogAuth,
  name: 'get_experiment_results',
  classification: 'READ',
  displayName: 'Get Experiment Results',
  description: 'Get the current results of an experiment for its primary metrics.',
  audience: 'ai',
  aiMetadata: {
    description: 'Computes current results of one PostHog experiment (numeric id from List Experiments) for its first 5 primary metrics. Per metric: control and each test variant with exposures (samples), metric sum, chanceToWin (Bayesian) or pValue (frequentist), significant, interval and validationFailures (e.g. not-enough-exposures). A metric that fails to compute returns error instead of failing the action. Draft experiments return zero exposures. Read-only but runs a query per metric, so it can take several seconds.',
    idempotent: true,
  },
  outputSchema: resultsSchema,
  props: {
    experimentId: Property.ShortText({ displayName: 'Experiment ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const experimentId = posthogClient.numericId({ value: propsValue.experimentId, label: 'Experiment ID' });
    const experiment = recordOf(
      await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['experiments', experimentId] }),
      }),
    );
    const allMetrics = arrayOf(experiment['metrics']).filter(isRecord);
    const metrics = [];
    for (const metric of allMetrics.slice(0, MAX_METRICS)) {
      const summary = { uuid: str(metric['uuid']), name: str(metric['name']), metricType: str(metric['metric_type']) };
      try {
        const body = recordOf(
          await posthogClient.request({
            auth: auth.props,
            method: HttpMethod.POST,
            path: posthogClient.projectPath({ auth: auth.props, segments: ['query'] }),
            body: { query: { kind: 'ExperimentQuery', experiment_id: Number(experimentId), metric }, name: 'activepieces' },
          }),
        );
        metrics.push({ ...summary, error: null, control: variant(body['baseline']), variants: arrayOf(body['variant_results']).map(variant) });
      } catch (error) {
        metrics.push({ ...summary, error: error instanceof Error ? error.message : String(error), control: null, variants: [] });
      }
    }
    return {
      experimentId: num(experiment['id']),
      name: str(experiment['name']),
      status: str(experiment['status']),
      featureFlagKey: str(experiment['feature_flag_key']),
      startDate: str(experiment['start_date']),
      endDate: str(experiment['end_date']),
      metrics,
      totalMetrics: allMetrics.length,
      truncated: allMetrics.length > MAX_METRICS,
    };
  },
});
