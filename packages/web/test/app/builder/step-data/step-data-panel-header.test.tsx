/**
 * @vitest-environment jsdom
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { StepDataPanelHeader } from '@/app/builder/step-data/step-data-panel-header';

vi.mock('i18next', () => ({ t: (key: string) => key }));

describe('StepDataPanelHeader', () => {
  it('shows a paused step as Paused, not Success', () => {
    const view = renderToStaticMarkup(
      <StepDataPanelHeader status="paused" viewMode="run" />,
    );

    expect(view).toContain('Paused');
    expect(view).not.toContain('Success');
    expect(view).not.toContain('bg-success-100');
  });

  it('labels a running step in run view as Running', () => {
    const view = renderToStaticMarkup(
      <StepDataPanelHeader status="testing" viewMode="run" />,
    );

    expect(view).toContain('Running');
    expect(view).not.toContain('Testing...');
  });

  it('keeps the Testing... label while testing a step in edit view', () => {
    const view = renderToStaticMarkup(
      <StepDataPanelHeader status="testing" viewMode="edit" />,
    );

    expect(view).toContain('Testing...');
    expect(view).not.toContain('Running');
  });

  it('keeps the Success label for a succeeded step in run view', () => {
    const view = renderToStaticMarkup(
      <StepDataPanelHeader status="success" viewMode="run" />,
    );

    expect(view).toContain('Success');
    expect(view).toContain('bg-success-100');
  });
});
