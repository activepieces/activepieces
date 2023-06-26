import { render } from '@testing-library/react';

import CollapsibleProperties from './collapsible-properties';

describe('CollapsibleProperties', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CollapsibleProperties />);
    expect(baseElement).toBeTruthy();
  });
});
