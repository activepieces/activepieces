import { Property } from '@activepieces/pieces-framework';

function direction() {
  return Property.StaticDropdown({
    displayName: 'Direction',
    required: false,
    defaultValue: 'desc',
    icon: 'sliders',
    options: {
      disabled: false,
      options: [
        { label: 'Descending', value: 'desc' },
        { label: 'Ascending', value: 'asc' },
      ],
    },
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description:
      'Results per page. Outseta caps this at 100, and at 25 when related records are included.',
    required: false,
    defaultValue: 100,
    display: 'stepper',
    min: 1,
    max: 100,
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page number, starting at 0. Outseta pages by page number, not by record.',
    required: false,
    defaultValue: 0,
    display: 'stepper',
    min: 0,
    max: 10000,
  });
}

function sortBy({ options, defaultValue }: SortByParams) {
  return Property.StaticDropdown({
    displayName: 'Sort by',
    required: false,
    defaultValue,
    icon: 'sliders',
    options: { disabled: false, options },
  });
}

export const outsetaListProps = { sortBy, direction, limit, page };

type SortByParams = {
  options: { label: string; value: string }[];
  defaultValue: string;
};
