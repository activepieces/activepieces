import { AppConnectionType } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MssqlAuth, mssqlConnect } from '../common';
import { newOrUpdatedRowTrigger } from './new-or-updated-row';

/**
 * Drives the real trigger against a real SQL Server. These are the scenarios
 * that cannot be settled by inspecting generated SQL: a bulk UPDATE collapsing
 * thousands of rows onto one timestamp, sub-millisecond datetime2, a bigint
 * identity past the range a JavaScript number can hold.
 *
 * Two ways to point it at a server, and it skips entirely with neither.
 *
 * A throwaway container, which also gets its own database created and dropped:
 *
 *   docker run -d --name ap-mssql-test -e ACCEPT_EULA=Y \
 *     -e MSSQL_SA_PASSWORD='Str0ng!Passw0rd#2026' -p 1433:1433 \
 *     mcr.microsoft.com/mssql/server:2022-latest
 *   AP_MSSQL_TEST_HOST=localhost AP_MSSQL_TEST_PASSWORD='...' npx vitest run
 *
 * Or an existing server such as Azure SQL, via the same connection string a
 * user would paste into the piece. Nothing is created or dropped except tables
 * named with the TABLE_PREFIX below, so it is safe against a shared database
 * (it still needs rights to create tables in it):
 *
 *   AP_MSSQL_TEST_CONNECTION_STRING='Server=...;Database=...;User ID=...' npx vitest run
 */
const connectionString = process.env['AP_MSSQL_TEST_CONNECTION_STRING'];
const host = process.env['AP_MSSQL_TEST_HOST'];
const enabled = Boolean(connectionString ?? host);

/** every object this suite creates carries it, and it drops nothing else */
const TABLE_PREFIX = 'ap_poll_test_';

const auth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: connectionString
    ? { connection_string: connectionString }
    : {
        host,
        port: Number(process.env['AP_MSSQL_TEST_PORT'] ?? 1433),
        database: process.env['AP_MSSQL_TEST_DATABASE'] ?? 'ap_trigger_test',
        user: process.env['AP_MSSQL_TEST_USER'] ?? 'sa',
        password: process.env['AP_MSSQL_TEST_PASSWORD'],
        encrypt: true,
        trust_server_certificate: true,
      },
} as unknown as MssqlAuth;

type Row = Record<string, unknown>;

/**
 * A store that round-trips through JSON exactly as the platform's does, so a
 * value the cursor could not actually persist fails here too.
 */
function fakeStore() {
  const entries = new Map<string, string>();
  return {
    get: async <T>(key: string): Promise<T | null> => {
      const raw = entries.get(key);
      return raw === undefined ? null : (JSON.parse(raw) as T);
    },
    put: async <T>(key: string, value: T): Promise<T> => {
      entries.set(key, JSON.stringify(value));
      return value;
    },
    delete: async (key: string): Promise<void> => {
      entries.delete(key);
    },
  };
}

type Props = {
  table: { table_schema: string; table_name: string };
  order_by: string;
  order_direction: 'ASC' | 'DESC';
  max_rows?: number;
};

function harness(props: Props) {
  const store = fakeStore();
  const context = {
    auth,
    propsValue: props,
    store,
    isRepublish: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const poll = async (): Promise<Row[]> =>
    (await newOrUpdatedRowTrigger.run(context)) as Row[];

  return {
    store,
    enable: () => newOrUpdatedRowTrigger.onEnable(context),
    preview: async () => (await newOrUpdatedRowTrigger.test(context)) as Row[],
    poll,
    /** poll until a poll comes back empty, the way the scheduler would */
    drain: async (limit = 200) => {
      const rows: Row[] = [];
      let polls = 0;
      for (;;) {
        const page = await poll();
        polls++;
        if (page.length === 0) break;
        rows.push(...page);
        if (polls >= limit)
          throw new Error(`drain did not finish in ${limit} polls`);
      }
      return { rows, polls };
    },
  };
}

let pool: sql.ConnectionPool;

async function exec(statement: string): Promise<void> {
  await pool.request().batch(statement);
}

/**
 * A table per test, so nothing leaks between them. Every name is prefixed, and
 * dropped before being created, so a run against a database that is not ours
 * can only ever touch its own tables.
 */
const created: string[] = [];
function nextTable(): { table_schema: string; table_name: string } {
  const table_name = `${TABLE_PREFIX}${created.length + 1}`;
  created.push(table_name);
  return { table_schema: 'dbo', table_name };
}

async function createTable(
  table: { table_name: string },
  body: string
): Promise<void> {
  await exec(
    `IF OBJECT_ID('dbo.${table.table_name}', 'U') IS NOT NULL
       DROP TABLE dbo.${table.table_name};
     CREATE TABLE dbo.${table.table_name} (${body});`
  );
}

/** generates 1..n as a rowset, without a round trip per row */
const series = (n: number) =>
  `SELECT TOP (${n}) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
   FROM sys.all_objects a CROSS JOIN sys.all_objects b`;

function ids(rows: Row[]): number[] {
  return rows.map((row) => Number(row['id']));
}

describe.skipIf(!enabled)('new or updated row, against a live server', () => {
  beforeAll(async () => {
    // Only the throwaway container gets its own database. A supplied connection
    // string is used exactly as given: creating or dropping a database there
    // would be presumptuous, and Azure SQL does not allow it from a user
    // connection anyway.
    if (!connectionString) {
      const bootstrap = await mssqlConnect({
        ...auth,
        props: { ...auth.props, database: 'master' },
      } as MssqlAuth);
      try {
        await bootstrap.request().batch(
          `IF DB_ID('ap_trigger_test') IS NOT NULL
           BEGIN
             ALTER DATABASE ap_trigger_test SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
             DROP DATABASE ap_trigger_test;
           END;
           CREATE DATABASE ap_trigger_test;`
        );
      } finally {
        await bootstrap.close();
      }
    }
    pool = await mssqlConnect(auth);
    const server = await pool
      .request()
      .query<Row>(`SELECT DB_NAME() AS db, @@VERSION AS version`);
    console.log(
      `[integration] database=${server.recordset[0]['db']} ` +
        `${String(server.recordset[0]['version']).split('\n')[0]}`
    );
  }, 180_000);

  afterAll(async () => {
    if (!pool) return;
    // leave the database as it was found
    for (const table of created) {
      await exec(
        `IF OBJECT_ID('dbo.${table}', 'U') IS NOT NULL DROP TABLE dbo.${table};`
      ).catch(() => undefined);
    }
    await pool.close();
  }, 120_000);

  it('walks a backlog larger than one page without skipping the middle', async () => {
    // the old design took the newest page and moved its cursor to that page's
    // head, discarding every row between the old position and the page
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         created_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${table.table_name} (created_at)
       SELECT DATEADD(ms, n, '2030-01-01') FROM (${series(10)}) s`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
      max_rows: 200,
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${table.table_name} (created_at)
       SELECT DATEADD(ms, 1000 + n, '2030-01-01') FROM (${series(1000)}) s`
    );

    const { rows, polls } = await trigger.drain();
    expect(rows).toHaveLength(1000);
    expect(new Set(ids(rows)).size).toBe(1000);
    expect(ids(rows)).toEqual(
      ids(rows)
        .slice()
        .sort((a, b) => a - b)
    );
    expect(polls).toBeGreaterThan(5);
  }, 120_000);

  it('delivers every row of a 3000-row tie group from one bulk UPDATE', async () => {
    // GETDATE() is a per-statement constant, so one UPDATE stamps every row it
    // touches with the identical value. The old design stalled here: its page
    // was ordered newest-first, so it re-read the same top 1000 rows forever and
    // the remaining 2000 became unreachable.
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         updated_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${table.table_name} (updated_at)
       SELECT DATEADD(ms, n, '2020-01-01') FROM (${series(3000)}) s`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
      max_rows: 200,
    });
    await trigger.enable();

    // one statement, so every row lands on the identical value
    await exec(`UPDATE ${table.table_name} SET updated_at = GETDATE()`);

    const { rows } = await trigger.drain();
    expect(rows).toHaveLength(3000);
    expect(new Set(ids(rows)).size).toBe(3000);
    expect(
      ids(rows)
        .slice()
        .sort((a, b) => a - b)
    ).toEqual(Array.from({ length: 3000 }, (_, i) => i + 1));
  }, 240_000);

  it('does not see a row written behind the position, as documented', async () => {
    // this is the one loss polling cannot avoid: a value below the high-water
    // mark, whether from a late-committing transaction, a clock that stepped
    // back, or an explicit older timestamp. Pinned here so it stays a known
    // limitation rather than becoming a surprise.
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         updated_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${table.table_name} (updated_at) VALUES ('2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${table.table_name} (updated_at) VALUES ('2020-01-01')`
    );
    expect(await trigger.poll()).toHaveLength(0);

    // and it recovers the moment a value moves past the position again
    await exec(
      `INSERT INTO ${table.table_name} (updated_at) VALUES ('2031-01-01')`
    );
    expect(ids(await trigger.poll())).toEqual([3]);
  }, 120_000);

  it('does not redeliver a datetime2(7) row whose value is below the millisecond', async () => {
    // the driver hands back a Date, which holds milliseconds, so a cursor read
    // from the row value would sit below it and re-match it on every poll
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         updated_at datetime2(7) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
      max_rows: 200,
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${table.table_name} (updated_at) VALUES
         ('2030-01-01T00:00:00.0000001'),
         ('2030-01-01T00:00:00.0000002'),
         ('2030-01-01T00:00:00.0000003'),
         ('2030-01-01T00:00:00.9999999')`
    );

    const first = await trigger.poll();
    expect(first).toHaveLength(4);
    expect(await trigger.poll()).toHaveLength(0);
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('pages inside a tie group on a bigint identity past 2^53', async () => {
    // node-mssql maps bigint to a JavaScript number, which rounds above 2^53;
    // a cursor built from that value would skip or repeat rows
    const table = nextTable();
    const seed = '9007199254740992';
    await createTable(
      table,
      `
         id bigint IDENTITY(${seed},1) PRIMARY KEY,
         updated_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
      max_rows: 2,
    });
    await trigger.enable();

    // one shared ordering value, so the identity is the only discriminator and
    // the page has to resume inside the group
    await exec(
      `INSERT INTO ${table.table_name} (updated_at)
       SELECT '2030-01-01T00:00:00.000' FROM (${series(5)}) s`
    );

    const { rows } = await trigger.drain();
    expect(rows).toHaveLength(5);
    const delivered = rows.map((row) => String(row['id']));
    expect(new Set(delivered).size).toBe(5);
    expect(delivered).toContain(seed);
    expect(delivered).toContain('9007199254740996');
  }, 120_000);

  it('delivers the first row ever written to a table that was empty at enable', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         created_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${table.table_name} (created_at) VALUES ('2030-01-01')`
    );
    const rows = await trigger.poll();
    expect(ids(rows)).toEqual([1]);
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('skips rows whose ordering value is NULL', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         updated_at datetime2(3) NULL`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${table.table_name} (updated_at) VALUES
         (NULL), ('2030-01-01'), (NULL), ('2030-01-02')`
    );
    const { rows } = await trigger.drain();
    expect(ids(rows)).toEqual([2, 4]);
  }, 120_000);

  it('walks downward when the newest rows carry the smallest values', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         rank_no int NOT NULL`
    );
    await exec(
      `INSERT INTO ${table.table_name} (rank_no) SELECT 1000 FROM (${series(
        1
      )}) s`
    );

    const trigger = harness({
      table,
      order_by: 'rank_no',
      order_direction: 'ASC',
      max_rows: 10,
    });
    await trigger.enable();

    // smaller means newer here, so these are all new
    await exec(
      `INSERT INTO ${table.table_name} (rank_no)
       SELECT 1000 - n FROM (${series(50)}) s`
    );

    const { rows } = await trigger.drain();
    expect(rows).toHaveLength(50);
    const values = rows.map((row) => Number(row['rank_no']));
    // delivered oldest first, which for this direction is largest first
    expect(values).toEqual(values.slice().sort((a, b) => b - a));
  }, 120_000);

  it('follows a rowversion column, which is binary and monotonic', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         payload nvarchar(50) NULL,
         rv rowversion`
    );
    await exec(
      `INSERT INTO ${table.table_name} (payload) SELECT 'seed' FROM (${series(
        5
      )}) s`
    );

    const trigger = harness({
      table,
      order_by: 'rv',
      order_direction: 'DESC',
      max_rows: 2,
    });
    await trigger.enable();
    expect(await trigger.poll()).toHaveLength(0);

    await exec(`UPDATE ${table.table_name} SET payload = 'edited'`);

    const { rows } = await trigger.drain();
    expect(rows).toHaveLength(5);
    expect(new Set(ids(rows)).size).toBe(5);
  }, 120_000);

  describe('a table with no key at all', () => {
    it('fills a page out of many ordering values', async () => {
      const table = nextTable();
      await createTable(
        table,
        `
           id int NOT NULL,
           created_at datetime2(3) NOT NULL`
      );

      const trigger = harness({
        table,
        order_by: 'created_at',
        order_direction: 'DESC',
        max_rows: 40,
      });
      await trigger.enable();

      // 100 distinct values, 5 rows each
      await exec(
        `INSERT INTO ${table.table_name} (id, created_at)
         SELECT n, DATEADD(ms, n % 100, '2030-01-01') FROM (${series(500)}) s`
      );

      const { rows, polls } = await trigger.drain();
      expect(rows).toHaveLength(500);
      expect(new Set(ids(rows)).size).toBe(500);
      // a page of 40 holds 8 whole groups of 5, so this must not take 100 polls
      expect(polls).toBeLessThan(20);
    }, 240_000);

    it('delivers one ordering value that is bigger than a whole page', async () => {
      const table = nextTable();
      await createTable(
        table,
        `
           id int NOT NULL,
           created_at datetime2(3) NOT NULL`
      );

      const trigger = harness({
        table,
        order_by: 'created_at',
        order_direction: 'DESC',
        max_rows: 50,
      });
      await trigger.enable();

      await exec(
        `INSERT INTO ${table.table_name} (id, created_at)
         SELECT n, '2030-01-01T00:00:00.000' FROM (${series(300)}) s`
      );

      // trimming the trailing value would leave nothing, so the value is taken
      // complete in one poll even though it exceeds the page
      const page = await trigger.poll();
      expect(page).toHaveLength(300);
      expect(await trigger.poll()).toHaveLength(0);
    }, 120_000);
  });

  it('re-baselines instead of replaying when the table shape changes', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) CONSTRAINT pk_shape PRIMARY KEY,
         created_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${table.table_name} (created_at)
       SELECT DATEADD(ms, n, '2030-01-01') FROM (${series(20)}) s`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    // dropping the key moves the plan from keyset to group mode, so the saved
    // position no longer describes the same columns
    await exec(`ALTER TABLE ${table.table_name} DROP CONSTRAINT pk_shape`);

    expect(await trigger.poll()).toHaveLength(0);
    await exec(
      `INSERT INTO ${table.table_name} (created_at) VALUES ('2031-01-01')`
    );
    const rows = await trigger.poll();
    expect(rows).toHaveLength(1);
  }, 120_000);

  // One case per ordering type whose text rendering is not obviously exact.
  // Each value must survive the trip out to the store and back into a
  // comparison, or the row is redelivered forever or skipped outright.
  const codecCases: { type: string; values: string[] }[] = [
    {
      type: 'time(7)',
      values: [
        `'00:00:00.0000001'`,
        `'12:34:56.1234567'`,
        `'23:59:59.9999999'`,
      ],
    },
    {
      type: 'datetimeoffset(7)',
      values: [
        `'2030-01-01T00:00:00.0000001+05:30'`,
        `'2030-06-01T12:00:00.7654321-08:00'`,
        `'2031-01-01T23:59:59.9999999+00:00'`,
      ],
    },
    { type: 'date', values: [`'2030-01-01'`, `'2030-06-15'`, `'2031-12-31'`] },
    {
      type: 'datetime',
      values: [
        `'2030-01-01T00:00:00.003'`,
        `'2030-01-01T00:00:00.007'`,
        `'2030-01-01T00:00:00.010'`,
      ],
    },
    {
      type: 'smalldatetime',
      // ISO 8601 needs the seconds, or the literal itself is rejected
      values: [
        `'2030-01-01T00:01:00'`,
        `'2030-01-01T00:02:00'`,
        `'2030-01-01T00:03:00'`,
      ],
    },
    {
      type: 'decimal(28,10)',
      values: ['1.0000000001', '1.0000000002', '999999999999999.9999999999'],
    },
    { type: 'float', values: ['0.1', '0.30000000000000004', '1.7e308'] },
    // money renders only two decimals by default, so 0.0001 came back as 0.00
    // and the position never advanced -- the row was redelivered forever
    { type: 'money', values: ['0.0001', '0.0002', '922337203685477.5807'] },
    { type: 'smallmoney', values: ['0.0001', '0.0002', '214748.3647'] },
    {
      type: 'bigint',
      values: ['9007199254740993', '9007199254740994', '9223372036854775807'],
    },
    {
      type: 'varbinary(16)',
      values: ['0x00', '0x0001', '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    },
    {
      type: 'uniqueidentifier',
      values: [
        `'00000000-0000-0000-0000-000000000001'`,
        `'00000000-0000-0000-0000-000000000002'`,
        `'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'`,
      ],
    },
    {
      type: 'nvarchar(100)',
      values: [`N'aaa'`, `N'zzz'`, `N'日本語のテキスト'`],
    },
  ];

  describe.each(codecCases)('a $type ordering column', ({ type, values }) => {
    it('round-trips its position exactly', async () => {
      const table = nextTable();
      await createTable(
        table,
        `
           id int IDENTITY(1,1) PRIMARY KEY,
           v ${type} NOT NULL`
      );

      const trigger = harness({
        table,
        order_by: 'v',
        order_direction: 'DESC',
        max_rows: 1,
      });
      // empty at enable, so every value below counts as new
      await trigger.enable();

      await exec(
        `INSERT INTO ${table.table_name} (v) VALUES ${values
          .map((value) => `(${value})`)
          .join(', ')}`
      );

      // max_rows of 1 forces the position to be re-read and re-bound per row,
      // which is where a lossy rendering shows up
      const { rows } = await trigger.drain();
      expect(rows).toHaveLength(values.length);
      expect(new Set(ids(rows)).size).toBe(values.length);
      expect(await trigger.poll()).toHaveLength(0);
    }, 120_000);
  });

  it('keysets across a composite primary key', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         tenant_id int NOT NULL,
         code varchar(20) NOT NULL,
         id int NOT NULL,
         updated_at datetime2(3) NOT NULL,
         CONSTRAINT pk_composite PRIMARY KEY (tenant_id, code)`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
      max_rows: 3,
    });
    await trigger.enable();

    // 40 rows all sharing one timestamp, so the three-term keyset has to page
    // through them on (tenant_id, code) alone
    await exec(
      `INSERT INTO ${table.table_name} (tenant_id, code, id, updated_at)
       SELECT n % 4, CONCAT('c', n), n, '2030-01-01T00:00:00.000'
       FROM (${series(40)}) s`
    );

    const { rows } = await trigger.drain();
    expect(rows).toHaveLength(40);
    expect(new Set(ids(rows)).size).toBe(40);
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('previews the newest rows without moving the position', async () => {
    const table = nextTable();
    await createTable(
      table,
      `
         id int IDENTITY(1,1) PRIMARY KEY,
         created_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${table.table_name} (created_at)
       SELECT DATEADD(ms, n, '2030-01-01') FROM (${series(20)}) s`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();
    const before = await trigger.store.get('cursor');

    const preview = await trigger.preview();
    expect(preview).toHaveLength(5);
    expect(ids(preview)).toEqual([20, 19, 18, 17, 16]);
    expect(await trigger.store.get('cursor')).toEqual(before);
  }, 120_000);
});
