import { AppConnectionType, createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateRecordAction } from '../src/lib/actions/update-record';
import { NocoDBClient } from '../src/lib/common/client';

const BASE_ID = 'base1';
const TABLE_ID = 'table1';
const RECORD_ID = 7;

const TABLE_COLUMNS = {
  Empty: '',
  Nil: null,
  Undef: undefined,
  NoTags: [],
  Done: false,
  Count: 0,
  Name: 'Ada',
  Tags: ['a', 'b'],
};

describe('update record', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API version 4', () => {
    it('omits empty values, keeps false and 0, and keeps arrays as arrays', async () => {
      const updateRecord = await runWithVersion({ version: 4 });

      expect(updateRecord).toHaveBeenCalledTimes(1);
      expect(updateRecord).toHaveBeenCalledWith(
        BASE_ID,
        TABLE_ID,
        { id: RECORD_ID, fields: { Done: false, Count: 0, Name: 'Ada', Tags: ['a', 'b'] } },
        4,
      );
    });
  });

  describe('API version 3', () => {
    it('omits empty values, keeps false and 0, and joins arrays with commas', async () => {
      const updateRecord = await runWithVersion({ version: 3 });

      expect(updateRecord).toHaveBeenCalledTimes(1);
      expect(updateRecord).toHaveBeenCalledWith(
        BASE_ID,
        TABLE_ID,
        { Id: RECORD_ID, Done: false, Count: 0, Name: 'Ada', Tags: 'a,b' },
        3,
      );
    });
  });

  describe('API version not set', () => {
    it('is treated as version 3', async () => {
      const updateRecord = await runWithVersion({ version: undefined });

      expect(updateRecord).toHaveBeenCalledTimes(1);
      expect(updateRecord).toHaveBeenCalledWith(
        BASE_ID,
        TABLE_ID,
        { Id: RECORD_ID, Done: false, Count: 0, Name: 'Ada', Tags: 'a,b' },
        3,
      );
    });
  });
});

async function runWithVersion({ version }: { version: number | undefined }) {
  const updateRecord = vi.spyOn(NocoDBClient.prototype, 'updateRecord').mockResolvedValue({ Id: RECORD_ID });
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  await updateRecordAction.run({
    ...base,
    auth: {
      type: AppConnectionType.CUSTOM_AUTH,
      props: { baseUrl: 'https://nocodb.test', apiToken: 'token', version },
    },
    propsValue: {
      baseId: BASE_ID,
      tableId: TABLE_ID,
      recordId: RECORD_ID,
      tableColumns: TABLE_COLUMNS,
    },
  });
  return updateRecord;
}
