import { OracleDbAuth } from './types';
import oracledb from 'oracledb';

interface ExecuteManyResult {
  rowsAffected?: number;
}

export class OracleDbClient {
  private readonly auth: OracleDbAuth;
  private connection: oracledb.Connection | undefined;

  constructor(auth: OracleDbAuth) {
    this.auth = auth;
  }

  private async connect(): Promise<void> {
    const connectString =
      this.auth.connectionType === 'serviceName'
        ? `${this.auth.host}:${this.auth.port}/${this.auth.serviceName}`
        : this.auth.connectionString;

    this.connection = await oracledb.getConnection({
      user: this.auth.user,
      password: this.auth.password,
      connectString: connectString,
    });
  }

  public async getTables(): Promise<{ label: string; value: string }[]> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const result = await this.connection.execute<{ TABLE_NAME: string }>(
      `SELECT table_name FROM user_tables ORDER BY table_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await this.close();

    return (
      result.rows?.map((row) => ({
        label: row.TABLE_NAME,
        value: row.TABLE_NAME,
      })) || []
    );
  }

  public async insertRow(
    tableName: string,
    rowData: Record<string, unknown>
  ): Promise<{ success: boolean; rowsAffected: number }> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const columns = Object.keys(rowData);
    const values = Object.values(rowData);
    const placeholders = columns.map((_, i) => `:${i + 1}`).join(', ');
    const quotedColumns = columns.map((c) => `"${c}"`).join(', ');
    const quotedTableName = `"${tableName}"`;
    const sql = `INSERT INTO ${quotedTableName} (${quotedColumns}) VALUES (${placeholders})`;

    try {
      const result = await this.connection.execute(sql, values, {
        autoCommit: true,
      });
      await this.close();
      
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
      };
    } catch (error: any) {
      await this.close();
      throw this.handleOracleError(error);
    }
  }

  public async insertRows(
    tableName: string,
    rowsData: Record<string, unknown>[]
  ): Promise<{ success: boolean; rowsAffected: number }> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const columns = Object.keys(rowsData[0]);
    const quotedColumns = columns.map((c) => `"${c}"`).join(', ');
    const quotedTableName = `"${tableName}"`;

    const placeholders = columns.map((_, i) => `:${i + 1}`).join(', ');
    const sql = `INSERT INTO ${quotedTableName} (${quotedColumns}) VALUES (${placeholders})`;

    const bindData = rowsData.map((row) => columns.map((col) => row[col]));

    try {
      const result = await this.connection.executeMany(sql, bindData, {
        autoCommit: true,
      });
      await this.close();
      
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
      };
    } catch (error: any) {
      await this.close();
      throw this.handleOracleError(error);
    }
  }

  public async updateRow(
    tableName: string,
    values: Record<string, unknown>,
    filter: Record<string, unknown>
  ): Promise<{ success: boolean; rowsAffected: number }> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const valueKeys = Object.keys(values);
    const filterKeys = Object.keys(filter);

    const setClause = valueKeys.map((k) => `"${k}" = :set_${k}`).join(', ');

    const whereClause = filterKeys
      .map((k) => `"${k}" = :whr_${k}`)
      .join(' AND ');

    const binds: oracledb.BindParameters = {};

    for (const key of valueKeys) {
      binds[`set_${key}`] = values[key] as any;
    }
    for (const key of filterKeys) {
      binds[`whr_${key}`] = filter[key] as any;
    }

    let sql = `UPDATE "${tableName}" SET ${setClause}`;
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    try {
      const result = await this.connection.execute(sql, binds, {
        autoCommit: true,
      });

      await this.close();
      
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
      };
    } catch (error: any) {
      await this.close();
      throw this.handleOracleError(error);
    }
  }

  public async deleteRow(
    tableName: string,
    filter: Record<string, unknown>
  ): Promise<{ success: boolean; rowsAffected: number }> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const filterKeys = Object.keys(filter);

    const whereClause = filterKeys
      .map((k) => `"${k}" = :whr_${k}`)
      .join(' AND ');

    const binds: oracledb.BindParameters = {};
    for (const key of filterKeys) {
      binds[`whr_${key}`] = filter[key] as any;
    }

    const sql = `DELETE FROM "${tableName}" WHERE ${whereClause}`;

    try {
      const result = await this.connection.execute(sql, binds, {
        autoCommit: true,
      });

      await this.close();
      
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0,
      };
    } catch (error: any) {
      await this.close();
      throw this.handleOracleError(error);
    }
  }

  public async findRow(
    tableName: string,
    filter: Record<string, unknown>
  ): Promise<unknown[]> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const filterKeys = Object.keys(filter);

    const whereClause = filterKeys
      .map((k) => `"${k}" = :whr_${k}`)
      .join(' AND ');

    const binds: oracledb.BindParameters = {};
    for (const key of filterKeys) {
      binds[`whr_${key}`] = filter[key] as any;
    }

    const sql = `SELECT * FROM "${tableName}" WHERE ${whereClause}`;

    try {
      const result = await this.connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      await this.close();
      return (result.rows as unknown[]) || [];
    } catch (error: any) {
      await this.close();
      throw this.handleOracleError(error);
    }
  }

  public async execute(
    sql: string,
    binds: oracledb.BindParameters
  ): Promise<{ rows: unknown[]; rowsAffected?: number }> {
    await this.connect();

    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    try {
      const result = await this.connection.execute(sql, binds, {
        autoCommit: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      await this.close();
      
      return {
        rows: (result.rows as unknown[]) || [],
        rowsAffected: result.rowsAffected,
      };
    } catch (error: any) {
      await this.close();
      throw this.handleOracleError(error);
    }
  }

  public async getNewRows(
    tableName: string,
    orderByColumn: string,
    lastValue: unknown,
    filter: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    await this.connect();
    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const filterKeys = Object.keys(filter);
    const whereConditions = filterKeys.map((k) => `"${k}" = :whr_${k}`);
    whereConditions.push(`"${orderByColumn}" > :lastValue`);

    const whereClause = whereConditions.join(' AND ');

    const binds: Record<string, any> = { lastValue };
    for (const key of filterKeys) {
      binds[`whr_${key}`] = filter[key];
    }

    const sql = `SELECT * FROM "${tableName}" WHERE ${whereClause} ORDER BY "${orderByColumn}" ASC`;

    const result = await this.connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    await this.close();
    return result.rows as Record<string, unknown>[];
  }

  public async getLatestRows(
    tableName: string,
    orderByColumn: string,
    filter: Record<string, unknown>
  ): Promise<oracledb.Result<unknown>> {
    await this.connect();
    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }

    const filterKeys = Object.keys(filter);
    const whereClause = filterKeys
      .map((k) => `"${k}" = :whr_${k}`)
      .join(' AND ');

    const binds: oracledb.BindParameters = {};
    for (const key of filterKeys) {
      binds[`whr_${key}`] = filter[key] as any;
    }

    let sql = `SELECT * FROM "${tableName}"`;
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }
    sql += ` ORDER BY "${orderByColumn}" DESC FETCH FIRST 5 ROWS ONLY`;

    const result = await this.connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

    await this.close();
    return result;
  }

  public async getColumns(
    tableName: string
  ): Promise<{ label: string; value: string }[]> {
    await this.connect();
    if (!this.connection) {
      throw new Error('Database connection failed and was not established.');
    }
    const result = await this.connection.execute<{ COLUMN_NAME: string }>(
      `SELECT column_name FROM user_tab_columns WHERE table_name = :tableName ORDER BY column_id`,
      { tableName },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    await this.close();
    return (
      result.rows?.map((row) => ({
        label: row.COLUMN_NAME,
        value: row.COLUMN_NAME,
      })) || []
    );
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }

  private handleOracleError(error: any): Error {
    const errorNum = error?.errorNum;
    let message = error?.message || 'Unknown Oracle error';

    // Common Oracle error codes
    if (errorNum === 1) {
      message = `Unique constraint violated: ${message}`;
    } else if (errorNum === 2290 || errorNum === 2291 || errorNum === 2292) {
      message = `Constraint violation: ${message}`;
    } else if (errorNum === 1400) {
      message = `Required column missing: ${message}`;
    } else if (errorNum === 904 || errorNum === 942) {
      message = `Invalid column or table: ${message}`;
    } else if (errorNum === 1722) {
      message = `Invalid number format: ${message}`;
    } else if (errorNum === 12899) {
      message = `Value too large for column: ${message}`;
    }

    return new Error(message);
  }
}
