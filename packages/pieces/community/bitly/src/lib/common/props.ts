import { Property } from '@activepieces/pieces-framework';

export const shapeDropdown = Property.StaticDropdown({
  displayName: 'Shape',
  description: 'Select the shape of the second corner of the QR code',
  required: true,
  options: {
    options: [
      { label: 'Standard', value: 'standard' },
      { label: 'Slightly Round', value: 'slightly_round' },
      { label: 'Rounded', value: 'rounded' },
      { label: 'Extra Round', value: 'extra_round' },
      { label: 'Leaf', value: 'leaf' },
      { label: 'Leaf Inner', value: 'leaf_inner' },
      { label: 'Leaf Outer', value: 'leaf_outer' },
      { label: 'Target', value: 'target' },
      { label: 'Concave', value: 'concave' },
    ],
  },
});
