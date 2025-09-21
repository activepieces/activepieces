import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { EmbedModeRouteGuard } from './embed-mode-route-guard';

// Mock the embed mode hook
jest.mock('@/hooks/use-embed-mode', () => ({
  useEmbedMode: () => ({ isEmbedMode: true }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/some-other-route' }),
}));

describe('EmbedModeRouteGuard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should redirect to /flows when in embed mode and route is not allowed', () => {
    render(
      <MemoryRouter>
        <EmbedModeRouteGuard>
          <div>Test Content</div>
        </EmbedModeRouteGuard>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/flows', { replace: true });
  });

  it('should render children when route is allowed', () => {
    // Mock useLocation to return an allowed route
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => ({ pathname: '/flows' }),
    }));

    render(
      <MemoryRouter>
        <EmbedModeRouteGuard>
          <div>Test Content</div>
        </EmbedModeRouteGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
