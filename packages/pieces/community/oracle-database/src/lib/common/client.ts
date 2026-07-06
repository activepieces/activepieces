import { runnerPool } from './runner-pool';
import type {
  AffectedResult,
  DropdownEntry,
  ExecuteResult,
  RunnerAuth,
  RunnerMode,
  RunnerRequestPayload,
} from './runner-protocol';
import type { OracleDbAuth } from './types';

export class OracleDbClient {
  private readonly auth: RunnerAuth;
  private readonly mode: RunnerMode;

  constructor(auth: OracleDbAuth) {
    this.auth = {
      connectionType: auth.connectionType,
      host: auth.host,
      port: auth.port,
      serviceName: auth.serviceName,
      connectionString: auth.connectionString,
      user: auth.user,
      password: auth.password,
      thickMode: auth.thickMode ?? false,
    };
    this.mode = this.auth.thickMode ? 'thick' : 'thin';
  }

  public async getTables(): Promise<DropdownEntry[]> {
    return this.send<DropdownEntry[]>({ cmd: 'getTables', auth: this.auth });
  }

  public async getColumns(tableName: string): Promise<DropdownEntry[]> {
    return this.send<DropdownEntry[]>({
      cmd: 'getColumns',
      auth: this.auth,
      tableName,
    });
  }

  public async insertRow(
    tableName: string,
    row: Record<string, unknown>
  ): Promise<AffectedResult> {
    return this.send<AffectedResult>({
      cmd: 'insertRow',
      auth: this.auth,
      tableName,
      row,
    });
  }

  public async insertRows(
    tableName: string,
    rows: Record<string, unknown>[]
  ): Promise<AffectedResult> {
    return this.send<AffectedResult>({
      cmd: 'insertRows',
      auth: this.auth,
      tableName,
      rows,
    });
  }

  public async updateRow(
    tableName: string,
    values: Record<string, unknown>,
    filter: Record<string, unknown>
  ): Promise<AffectedResult> {
    return this.send<AffectedResult>({
      cmd: 'updateRow',
      auth: this.auth,
      tableName,
      values,
      filter,
    });
  }

  public async deleteRow(
    tableName: string,
    filter: Record<string, unknown>
  ): Promise<AffectedResult> {
    return this.send<AffectedResult>({
      cmd: 'deleteRow',
      auth: this.auth,
      tableName,
      filter,
    });
  }

  public async findRow(
    tableName: string,
    filter: Record<string, unknown>
  ): Promise<unknown[]> {
    return this.send<unknown[]>({
      cmd: 'findRow',
      auth: this.auth,
      tableName,
      filter,
    });
  }

  public async execute(
    sql: string,
    binds: Record<string, unknown>
  ): Promise<ExecuteResult> {
    return this.send<ExecuteResult>({
      cmd: 'execute',
      auth: this.auth,
      sql,
      binds,
    });
  }

  private async send<T>(req: RunnerRequestPayload): Promise<T> {
    const { runner } = await runnerPool.acquire(this.mode);
    const { result } = await runner.invoke<T>(req);
    return result;
  }
}
