import { render } from '@testing-library/react';

import Trigger from './trigger';

describe('Trigger', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Trigger />);
    expect(baseElement).toBeTruthy();
  });
});
