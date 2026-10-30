import { createTrigger, StaticPropsValue, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { redshiftAuth } from '../auth';
import { redshiftClient } from '../common/client';
import { redshiftProps } from '../common/props';
import { redshiftUtils } from '../common/utils';
import type { RedshiftAuthValue } from '../common/types';

const props = {
  table: redshiftProps.table({ required: true }),
  timestamp_column: redshiftProps.column({
    required: true,
    displayName: 'Updated At Column',
    description: 'A timestamp column your loads set on every insert and update, like updated_at. Read as UTC.',
  }),
};

const MAX_ROWS = 1000;

const polling: Polling<RedshiftAuthValue, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS, server }) => {
    if (!server) {
      throw new Error('Missing server context.');
    }
    const from = redshiftUtils.qualifiedName({ table: propsValue.table });
    const column = redshiftUtils.quoteIdentifier({ name: propsValue.timestamp_column });
    const isTest = lastFetchEpochMS === 0;
    const { rows } = await redshiftClient.runSql({
      auth,
      server,
      sql: isTest
        ? `SELECT * FROM ${from} WHERE ${column} IS NOT NULL ORDER BY ${column} DESC LIMIT 5`
        : `SELECT * FROM ${from} WHERE ${column} > $1 ORDER BY ${column} ASC LIMIT ${MAX_ROWS}`,
      params: isTest ? [] : [new Date(lastFetchEpochMS).toISOString().replace('T', ' ').replace('Z', '')],
    });
    return rows.flatMap((row) => {
      const epochMilliSeconds = toEpochMs({ value: row[propsValue.timestamp_column] });
      return epochMilliSeconds === undefined ? [] : [{ epochMilliSeconds, data: row }];
    });
  },
};

export const newOrUpdatedRow = createTrigger({
  auth: redshiftAuth,
  name: 'new_or_updated_row',
  classification: 'READ',
  displayName: 'New or Updated Row',
  description: 'Triggers when a row is added or its timestamp column changes.',
  aiMetadata: {
    description: 'Fires once for each row in an Amazon Redshift table whose chosen timestamp column (such as updated_at) moved past the last check, so it covers both new and updated rows. Each event carries one row.',
  },
  props,
  sampleData: { id: 1, name: 'Example', updated_at: '2026-01-01 00:00:00' },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

function toEpochMs({ value }: { value: unknown }): number | undefined {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const text = value.trim().replace(' ', 'T');
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text;
  const withZone = /([zZ]|[+-]\d{2}(:?\d{2})?)$/.test(withTime) ? withTime.replace(/([+-]\d{2})$/, '$1:00') : `${withTime}Z`;
  const epoch = Date.parse(withZone);
  return Number.isNaN(epoch) ? undefined : epoch;
}
