import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class OperationsPage extends BasePage {
  url = '/platform/health';

  async openRunsHealth(): Promise<RunMetrics> {
    return this.openAndRead<RunMetrics>({ path: '/platform/health/runs', apiPath: '/api/v1/health/run-metrics' });
  }

  async openQueueHealth(): Promise<QueueMetrics> {
    return this.openAndRead<QueueMetrics>({ path: '/platform/health/queue', apiPath: '/api/v1/health/queue-metrics' });
  }

  async openTriggers({ pieceName }: { pieceName: string }): Promise<number> {
    const report = await this.openAndRead<TriggerStatusReport>({ path: '/platform/triggers', apiPath: '/api/v1/trigger-runs/status' });
    return report.pieces[pieceName]?.totalRuns ?? 0;
  }

  stat(name: 'health-runs-jobs-done' | 'health-runs-success-rate' | 'health-queue-running' | 'health-queue-queued'): Locator {
    return this.page.getByTestId(name);
  }

  triggerTotalRuns(pieceDisplayName: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByText(pieceDisplayName, { exact: true }) })
      .getByTestId('trigger-health-total-runs');
  }

  private async openAndRead<T>({ path, apiPath }: { path: string; apiPath: string }): Promise<T> {
    const loaded = this.page.waitForResponse((response) => isGet({ response, apiPath }));
    await this.page.goto(path);
    const response = await loaded;
    expect(response.status(), `GET ${apiPath} failed`).toBe(200);
    return response.json();
  }
}

function isGet({ response, apiPath }: { response: Response; apiPath: string }): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname === apiPath;
}

export type RunMetrics = { summary: { completed: number; successRate: number } };
export type QueueMetrics = { running: number; queued: number };
type TriggerStatusReport = { pieces: Record<string, { totalRuns: number } | undefined> };
