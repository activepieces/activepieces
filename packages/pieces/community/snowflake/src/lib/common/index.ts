import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../..';
import snowflake, { Binds, Connection } from 'snowflake-sdk';

const DEFAULT_APPLICATION_NAME = 'ActivePieces';
const DEFAULT_QUERY_TIMEOUT = 30000;

export async function connect(conn: snowflake.Connection) {
  return await new Promise<void>((resolve, reject) => {
    conn.connect((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function destroy(conn: snowflake.Connection) {
  return await new Promise<void>((resolve, reject) => {
    conn.destroy((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function execute(
  conn: snowflake.Connection,
  sqlText: string,
  binds: snowflake.InsertBinds
) {
  return await new Promise<any[] | undefined>((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (error, _, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    });
  });
}
