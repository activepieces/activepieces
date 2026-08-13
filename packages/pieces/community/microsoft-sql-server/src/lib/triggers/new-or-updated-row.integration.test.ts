import { AppConnectionType } from '@activepieces/pieces-framework';
import sql from 'mssql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MssqlAuth, mssqlCommon } from '../common';
import { CURSOR_LAYOUT } from '../common/cursor';
import { newOrUpdatedRowTrigger } from './new-or-updated-row';


const connectionString = process.env['AP_MSSQL_TEST_CONNECTION_STRING'];
const host = process.env['AP_MSSQL_TEST_HOST'];
const enabled = Boolean(connectionString ?? host);


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
};

type HookContext = never;

function harness(props: Props) {
  const store = fakeStore();
  const context = {
    auth,
    propsValue: props,
    store,
    isRepublish: false,
  };

  const poll = async (): Promise<Row[]> =>
    (await newOrUpdatedRowTrigger.run(
      context as unknown as HookContext
    )) as Row[];

  return {
    store,
    enable: () =>
      newOrUpdatedRowTrigger.onEnable(context as unknown as HookContext),
    republish: () =>
      newOrUpdatedRowTrigger.onEnable({
        ...context,
        isRepublish: true,
      } as unknown as HookContext),
    preview: async () =>
      (await newOrUpdatedRowTrigger.test(
        context as unknown as HookContext
      )) as Row[],
    poll,
    
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


type Table = { table_schema: string; table_name: string };

const created: Table[] = [];
function nextTable(table_schema = 'dbo'): Table {
  const table = {
    table_schema,
    table_name: `${TABLE_PREFIX}${created.length + 1}`,
  };
  created.push(table);
  return table;
}


function quoted(table: Table): string {
  const escape = (part: string) => `[${part.split(']').join(']]')}]`;
  return `${escape(table.table_schema)}.${escape(table.table_name)}`;
}

async function createTable(table: Table, body: string): Promise<void> {
  await exec(
    `IF OBJECT_ID('${quoted(table)}', 'U') IS NOT NULL
       DROP TABLE ${quoted(table)};
     CREATE TABLE ${quoted(table)} (${body});`
  );
}


const series = (n: number) =>
  `SELECT TOP (${n}) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
   FROM sys.all_objects a CROSS JOIN sys.all_objects b`;

function ids(rows: Row[]): number[] {
  return rows.map((row) => Number(row['id']));
}

describe.skipIf(!enabled)('new or updated row, against a live server', () => {
  beforeAll(async () => {
    
    
    
    
    if (!connectionString) {
      const bootstrap = await mssqlCommon.connect({
        auth: {
          ...auth,
          props: { ...auth.props, database: 'master' },
        },
      });
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
    pool = await mssqlCommon.connect({ auth });
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
    
    for (const table of created) {
      await exec(
        `IF OBJECT_ID('${quoted(table)}', 'U') IS NOT NULL DROP TABLE ${quoted(
          table
        )};`
      ).catch(() => undefined);
    }
    await exec(`DROP SCHEMA IF EXISTS ap_poll_test_schema;`).catch(
      () => undefined
    );
    await pool.close();
  }, 120_000);

  it('walks a backlog larger than one page without skipping the middle', async () => {
    
    
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
    });
    await trigger.enable();

    
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

    
    await exec(
      `INSERT INTO ${table.table_name} (updated_at) VALUES ('2031-01-01')`
    );
    expect(ids(await trigger.poll())).toEqual([3]);
  }, 120_000);

  it('does not redeliver a datetime2(7) row whose value is below the millisecond', async () => {
    
    
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
    });
    await trigger.enable();

    
    
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
    });
    await trigger.enable();

    
    await exec(
      `INSERT INTO ${table.table_name} (rank_no)
       SELECT 1000 - n FROM (${series(50)}) s`
    );

    const { rows } = await trigger.drain();
    expect(rows).toHaveLength(50);
    const values = rows.map((row) => Number(row['rank_no']));
    
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
      });
      await trigger.enable();

      
      await exec(
        `INSERT INTO ${table.table_name} (id, created_at)
         SELECT n, DATEADD(ms, n % 100, '2030-01-01') FROM (${series(500)}) s`
      );

      const { rows, polls } = await trigger.drain();
      expect(rows).toHaveLength(500);
      expect(new Set(ids(rows)).size).toBe(500);
      
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
      });
      await trigger.enable();

      await exec(
        `INSERT INTO ${table.table_name} (id, created_at)
         SELECT n, '2030-01-01T00:00:00.000' FROM (${series(300)}) s`
      );

      
      
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

    
    
    await exec(`ALTER TABLE ${table.table_name} DROP CONSTRAINT pk_shape`);

    expect(await trigger.poll()).toHaveLength(0);
    await exec(
      `INSERT INTO ${table.table_name} (created_at) VALUES ('2031-01-01')`
    );
    const rows = await trigger.poll();
    expect(rows).toHaveLength(1);
  }, 120_000);

  
  
  
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
      values: [
        `N'00123'`,
        `N'a|b'`,
        `N'{"v":1}'`,
        `N'back\\slash'`,
        `N'aaa'`,
        `N'日本語のテキスト'`,
      ],
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
      });
      
      await trigger.enable();

      await exec(
        `INSERT INTO ${table.table_name} (v) VALUES ${values
          .map((value) => `(${value})`)
          .join(', ')}`
      );

      
      
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
    });
    await trigger.enable();

    
    
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

  
  it('delivers a row again each time it is edited', async () => {
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY,
       payload nvarchar(50) NOT NULL,
       updated_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${quoted(table)} (payload, updated_at)
       VALUES ('first', '2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
    });
    await trigger.enable();
    expect(await trigger.poll()).toHaveLength(0);

    await exec(
      `UPDATE ${quoted(table)} SET payload = 'edited once', updated_at = '2030-01-02'`
    );
    const first = await trigger.poll();
    expect(first).toHaveLength(1);
    expect(first[0]['payload']).toBe('edited once');

    await exec(
      `UPDATE ${quoted(table)} SET payload = 'edited twice', updated_at = '2030-01-03'`
    );
    const second = await trigger.poll();
    expect(second).toHaveLength(1);
    expect(second[0]['payload']).toBe('edited twice');

    
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('keeps its position when the flow is republished', async () => {
    
    
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, created_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();
    const position = await trigger.store.get('cursor');

    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-02')`
    );
    await trigger.republish();

    expect(await trigger.store.get('cursor')).toEqual(position);
    expect(ids(await trigger.poll())).toEqual([2]);
  }, 120_000);

  it('re-baselines on a fresh enable, skipping what came before', async () => {
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, created_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-02')`
    );
    
    await trigger.enable();

    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('carries on after the row its position named is deleted', async () => {
    
    
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, created_at datetime2(3) NOT NULL`
    );
    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(`DELETE FROM ${quoted(table)} WHERE id = 1`);
    expect(await trigger.poll()).toHaveLength(0);

    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-02')`
    );
    expect(ids(await trigger.poll())).toEqual([2]);
  }, 120_000);

  it('falls back to the default page size when max rows is nonsense', async () => {
    
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, created_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${quoted(table)} (created_at)
       SELECT DATEADD(ms, n, '2030-01-01') FROM (${series(3)}) s`
    );
    const { rows } = await trigger.drain(5);
    expect(rows).toHaveLength(3);
  }, 120_000);

  it('reads a table in a schema other than dbo', async () => {
    await exec(
      `IF SCHEMA_ID('ap_poll_test_schema') IS NULL EXEC('CREATE SCHEMA ap_poll_test_schema');`
    );
    const table = nextTable('ap_poll_test_schema');
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, created_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${quoted(table)} (created_at) VALUES ('2030-01-01')`
    );
    expect(ids(await trigger.poll())).toEqual([1]);
  }, 120_000);

  it('handles column names holding a bracket or a space', async () => {
    
    const table = nextTable();
    await createTable(
      table,
      `[id] int IDENTITY(1,1) PRIMARY KEY,
       [odd]]col] datetime2(3) NOT NULL,
       [my col] nvarchar(20) NULL`
    );

    const trigger = harness({
      table,
      order_by: 'odd]col',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${quoted(table)} ([odd]]col], [my col])
       VALUES ('2030-01-01', 'kept')`
    );
    const rows = await trigger.poll();
    expect(ids(rows)).toEqual([1]);
    expect(rows[0]['my col']).toBe('kept');
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('previews an empty table without failing', async () => {
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, created_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });

    expect(await trigger.preview()).toEqual([]);
  }, 120_000);

  it('refuses one ordering value bigger than the group ceiling', async () => {
    
    
    const table = nextTable();
    await createTable(
      table,
      `id int NOT NULL, created_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${quoted(table)} (id, created_at)
       SELECT n, '2030-01-01T00:00:00.000' FROM (${series(2001)}) s`
    );

    await expect(trigger.poll()).rejects.toThrow(
      /rows share one "created_at" value/
    );
  }, 240_000);

  it('catches a row inserted into the tie group the position sits inside', async () => {
    
    
    
    
    const table = nextTable();
    await createTable(
      table,
      `id int IDENTITY(1,1) PRIMARY KEY, updated_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    
    
    await exec(
      `INSERT INTO ${quoted(table)} (updated_at)
       SELECT '2030-01-01T00:00:00.000' FROM (${series(250)}) s`
    );
    expect(ids(await trigger.poll())).toEqual(
      Array.from({ length: 200 }, (_, i) => i + 1)
    );

    
    await exec(
      `INSERT INTO ${quoted(table)} (updated_at)
       VALUES ('2030-01-01T00:00:00.000')`
    );

    const { rows } = await trigger.drain();
    expect(ids(rows)).toEqual(
      Array.from({ length: 51 }, (_, i) => i + 201)
    );
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('raises an event for each of two byte-identical rows in a keyless table', async () => {
    
    
    
    const table = nextTable();
    await createTable(
      table,
      `message nvarchar(50) NOT NULL, created_at datetime2(3) NOT NULL`
    );

    const trigger = harness({
      table,
      order_by: 'created_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `INSERT INTO ${quoted(table)} (message, created_at) VALUES
         ('restart', '2030-01-01T10:00:00.000'),
         ('restart', '2030-01-01T10:00:00.000')`
    );

    const rows = await trigger.poll();
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row['message'])).toEqual(['restart', 'restart']);
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  it('does not re-fire an old row when its natural key is edited behind the position', async () => {
    
    
    
    const table = nextTable();
    await createTable(
      table,
      `email nvarchar(100) NOT NULL, updated_at datetime2(3) NOT NULL`
    );
    await exec(`CREATE UNIQUE INDEX ix_email ON ${quoted(table)} (email);`);
    await exec(
      `INSERT INTO ${quoted(table)} (email, updated_at)
       VALUES ('dave@old.com', '2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    await exec(
      `UPDATE ${quoted(table)} SET email = 'dave@new.com' WHERE email = 'dave@old.com'`
    );
    expect(await trigger.poll()).toHaveLength(0);

    
    await exec(
      `UPDATE ${quoted(table)} SET email = 'dave@newer.com', updated_at = '2030-01-02'`
    );
    const rows = await trigger.poll();
    expect(rows).toHaveLength(1);
    expect(rows[0]['email']).toBe('dave@newer.com');
    expect(await trigger.poll()).toHaveLength(0);
  }, 120_000);

  
  
  
  
  
  
  
  
  
  
  
  
  
  it('re-fires a delivered row when its natural key is edited ahead of the position', async () => {
    const table = nextTable();
    await createTable(
      table,
      `email nvarchar(100) NOT NULL, updated_at datetime2(3) NOT NULL`
    );
    await exec(`CREATE UNIQUE INDEX ix_email ON ${quoted(table)} (email);`);
    await exec(
      `INSERT INTO ${quoted(table)} (email, updated_at)
       VALUES ('dave@old.com', '2030-01-01')`
    );

    const trigger = harness({
      table,
      order_by: 'updated_at',
      order_direction: 'DESC',
    });
    await trigger.enable();

    
    
    await exec(
      `UPDATE ${quoted(table)} SET email = 'dave@zzz.com' WHERE email = 'dave@old.com'`
    );
    const rows = await trigger.poll();
    expect(rows).toHaveLength(1);
    expect(rows[0]['email']).toBe('dave@zzz.com');
  }, 120_000);

  
  
  
  describe('choosing a tiebreaker', () => {
    async function modeOf(table: Table, order_by: string) {
      const trigger = harness({ table, order_by, order_direction: 'DESC' });
      await trigger.enable();
      return (await trigger.store.get('cursor')) as {
        m: string;
        c: string[];
      };
    }

    it('will not trust a filtered unique index', async () => {
      
      const table = nextTable();
      await createTable(
        table,
        `code nvarchar(20) NULL, updated_at datetime2(3) NOT NULL`
      );
      await exec(
        `CREATE UNIQUE INDEX ix_filtered ON ${quoted(
          table
        )} (code) WHERE code IS NOT NULL;`
      );

      expect(await modeOf(table, 'updated_at')).toEqual({
        v: CURSOR_LAYOUT,
        m: 'group',
        c: ['updated_at:datetime2(3)'],
        k: null,
      });
    });

    it('will not trust a nullable unique index', async () => {
      
      
      const table = nextTable();
      await createTable(
        table,
        `code nvarchar(20) NULL, updated_at datetime2(3) NOT NULL`
      );
      await exec(
        `CREATE UNIQUE INDEX ix_nullable ON ${quoted(table)} (code);`
      );

      expect((await modeOf(table, 'updated_at')).m).toBe('group');
    });

    it('uses a non-nullable unique index when there is no primary key', async () => {
      const table = nextTable();
      await createTable(
        table,
        `code nvarchar(20) NOT NULL, updated_at datetime2(3) NOT NULL`
      );
      await exec(`CREATE UNIQUE INDEX ix_code ON ${quoted(table)} (code);`);

      expect(await modeOf(table, 'updated_at')).toMatchObject({
        m: 'keyset',
        c: ['updated_at:datetime2(3)', 'code:nvarchar(20)'],
      });
    });

    it('will not use an identity that only a composite index makes unique', async () => {
      
      
      const table = nextTable();
      await createTable(
        table,
        `id int IDENTITY(1,1) NOT NULL,
         tenant_id int NOT NULL,
         updated_at datetime2(3) NOT NULL`
      );
      await exec(
        `CREATE UNIQUE INDEX ix_composite ON ${quoted(
          table
        )} (id, tenant_id);`
      );

      expect(await modeOf(table, 'updated_at')).toMatchObject({
        m: 'keyset',
        c: ['updated_at:datetime2(3)', 'id:int', 'tenant_id:int'],
      });
    });

    it('will not use a descending identity, and falls back to the key', async () => {
      
      
      const table = nextTable();
      await createTable(
        table,
        `id int IDENTITY(1000,-1) PRIMARY KEY, updated_at datetime2(3) NOT NULL`
      );

      
      expect(await modeOf(table, 'updated_at')).toMatchObject({
        m: 'keyset',
        c: ['updated_at:datetime2(3)', 'id:int'],
      });
    });

    it('prefers the identity over a wider primary key', async () => {
      const table = nextTable();
      await createTable(
        table,
        `id int IDENTITY(1,1) NOT NULL,
         tenant_id int NOT NULL,
         updated_at datetime2(3) NOT NULL,
         CONSTRAINT pk_wide_${created.length} PRIMARY KEY (tenant_id, id)`
      );
      await exec(`CREATE UNIQUE INDEX ix_id ON ${quoted(table)} (id);`);

      expect(await modeOf(table, 'updated_at')).toMatchObject({
        m: 'keyset',
        c: ['updated_at:datetime2(3)', 'id:int'],
      });
    });
  });

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
