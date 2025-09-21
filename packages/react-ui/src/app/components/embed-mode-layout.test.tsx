import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmbedModeLayout } from './embed-mode-layout';

// Mock the embed mode hook
jest.mock('@/hooks/use-embed-mode', () => ({
  useEmbedMode: () => ({ isEmbedMode: true }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/flows' }),
}));

describe('EmbedModeLayout', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render tabs for flows, tables, and connections', () => {
    render(
      <MemoryRouter>
        <EmbedModeLayout>
          <div>Test Content</div>
        </EmbedModeLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Flows')).toBeInTheDocument();
    expect(screen.getByText('Tables')).toBeInTheDocument();
    expect(screen.getByText('Connections')).toBeInTheDocument();
  });

  it('should navigate to correct route when tab is clicked', () => {
    render(
      <MemoryRouter>
        <EmbedModeLayout>
          <div>Test Content</div>
        </EmbedModeLayout>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Tables'));
    expect(mockNavigate).toHaveBeenCalledWith('/tables');

    fireEvent.click(screen.getByText('Connections'));
    expect(mockNavigate).toHaveBeenCalledWith('/connections');
  });

  it('should highlight active tab', () => {
    render(
      <MemoryRouter>
        <EmbedModeLayout>
          <div>Test Content</div>
        </EmbedModeLayout>
      </MemoryRouter>
    );

    const flowsTab = screen.getByText('Flows');
    expect(flowsTab).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should render children in main content area', () => {
    render(
      <MemoryRouter>
        <EmbedModeLayout>
          <div>Test Content</div>
        </EmbedModeLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
