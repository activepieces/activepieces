import { Property } from '@activepieces/pieces-framework';

export function favoriteTriStateProp(entity: 'label' | 'project') {
  return Property.StaticDropdown<string>({
    displayName: 'Is Favorite',
    description: `Mark the ${entity} as a favorite, remove it from favorites, or leave the current setting unchanged.`,
    required: false,
    defaultValue: '',
    options: {
      options: [
        { label: 'Leave unchanged', value: '' },
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

export function parseTriState(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true') {
    return true;
  }
  if (normalized === 'no' || normalized === 'false') {
    return false;
  }
  return undefined;
}
