import { Property } from '@activepieces/pieces-framework';

export const freshnessDropdown = Property.StaticDropdown({
  displayName: 'Freshness',
  description: 'Filter results by time range. Defaults to no limit.',
  required: false,
  defaultValue: 'noLimit',
  options: {
    options: [
      { label: 'No Limit', value: 'noLimit' },
      { label: 'One Day', value: 'oneDay' },
      { label: 'One Week', value: 'oneWeek' },
      { label: 'One Month', value: 'oneMonth' },
      { label: 'One Year', value: 'oneYear' },
    ],
  },
});

export const countProp = Property.Number({
  displayName: 'Count',
  description: 'Number of results to return (1-50). Defaults to 10.',
  required: false,
  defaultValue: 10,
  validators: [Validators.minValue(1), Validators.maxValue(50)],
});
