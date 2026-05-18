import { ChildProcess, fork } from 'child_process';
import path from 'path';
import type {
  RunnerMode,
  RunnerRequest,
  RunnerRequestPayload,
  RunnerResponse,
} from './runner-protocol';
import { apId } from '@activepieces/shared';

class OracleRunnerError extends Error {
  public readonly logs?: string[];
  constructor(message: string, logs?: string[]) {
    super(message);
    this.name = 'OracleRunnerError';
    this.logs = logs;
  }
}

type Pending = {
  resolve: (value: { result: unknown; logs?: string[] }) => void;
  reject: (err: Error) => void;
};

class Runner {
  private readonly child: ChildProcess;
  private readonly pending = new Map<string, Pending>();
  private dead = false;
  private initLogsCache: string[] = [];

  constructor(child: ChildProcess) {
    this.child = child;
    child.on('message', (msg) => this.handleResponse(msg as RunnerResponse));
    child.once('exit', (code, signal) => {
      this.dead = true;
      const reason = signal
        ? `Oracle runner killed by signal ${signal}`
        : `Oracle runner exited (code ${code ?? 'unknown'})`;
      this.rejectAllPending(new OracleRunnerError(reason));
    });
    child.on('error', (err) => {
      this.dead = true;
      this.rejectAllPending(err);
    });
  }

  public setInitLogs(logs: string[]): void {
    this.initLogsCache = logs;
  }

  public consumeInitLogs(): string[] {
    const logs = this.initLogsCache;
    this.initLogsCache = [];
    return logs;
  }

  public invoke<T>(
    req: RunnerRequestPayload
  ): Promise<{ result: T; logs?: string[] }> {
    if (this.dead) {
      return Promise.reject(
        new OracleRunnerError('Oracle runner is no longer available')
      );
    }
    const id = apId();
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as Pending['resolve'],
        reject,
      });
      this.child.send({ ...req, id } as RunnerRequest, (sendErr) => {
        if (sendErr) {
          this.pending.delete(id);
          reject(sendErr);
        }
      });
    });
  }

  public kill(): void {
    if (!this.dead) this.child.kill();
  }

  private handleResponse(msg: RunnerResponse): void {
    const p = this.pending.get(msg.id);
    if (!p) return;
    this.pending.delete(msg.id);
    if (msg.ok) {
      p.resolve({ result: msg.result, logs: msg.logs });
    } else {
      p.reject(new OracleRunnerError(msg.error.message, msg.logs));
    }
  }

  private rejectAllPending(err: Error): void {
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
  }
}

const cache: { thin?: Promise<Runner>; thick?: Promise<Runner> } = {};

async function acquire(
  mode: RunnerMode
): Promise<{ runner: RunnerHandle; initLogs: string[] }> {
  let promise = cache[mode];
  if (!promise) {
    promise = (async () => {
      const runnerScript = path.join(__dirname, 'oracle-runner.js');
      const child = fork(runnerScript, [], {
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      });
      const runner = new Runner(child);

      child.once('exit', () => {
        if (cache[mode] === promise) delete cache[mode];
      });

      try {
        const { logs } = await runner.invoke<{ ready: boolean }>({
          cmd: 'init',
          thickMode: mode === 'thick',
        });
        runner.setInitLogs(logs ?? []);
        return runner;
      } catch (err) {
        runner.kill();
        if (cache[mode] === promise) delete cache[mode];
        throw err;
      }
    })();
    cache[mode] = promise;
  }

  const runner = await promise;
  return { runner, initLogs: runner.consumeInitLogs() };
}

export const runnerPool = { acquire };

export type RunnerHandle = Pick<Runner, 'invoke'>;

export { OracleRunnerError };
