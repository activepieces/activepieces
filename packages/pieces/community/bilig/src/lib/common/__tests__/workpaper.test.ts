import * as biligRuntime from '@bilig/headless';
import { beforeAll, describe, expect, it } from 'vitest';
import { biligWorkpaperTestUtils, biligWorkpaperUtils } from '../workpaper';

describe('biligWorkpaperUtils', () => {
  beforeAll(() => {
    biligWorkpaperTestUtils.setBiligRuntimeLoaderForTesting(async () => biligRuntime);
  });

  it('validates formulas with the Bilig WorkPaper runtime', async () => {
    await expect(biligWorkpaperUtils.validateFormula('=SUM(1, 2)')).resolves.toEqual({
      valid: true,
      formula: '=SUM(1, 2)',
      errors: [],
    });
  });

  it('rejects formulas without an equals prefix', async () => {
    await expect(biligWorkpaperUtils.validateFormula('Inputs!B2*Inputs!B3')).resolves.toMatchObject({
      valid: false,
      errors: ['formula_invalid'],
    });
  });

  it('reads recalculated range values from a persisted demo WorkPaper document', async () => {
    const result = await biligWorkpaperUtils.readRange({
      workpaper: biligWorkpaperUtils.createDemoWorkpaper(),
      sheet: 'Summary',
      range: 'A1:B2',
    });

    expect(result).toMatchObject({
      sheet: 'Summary',
      range: 'A1:B2',
      rows: [
        [
          {
            address: 'A1',
            serialized: 'Metric',
            formula: undefined,
            scalarValue: 'Metric',
            displayValue: 'Metric',
          },
          {
            address: 'B1',
            serialized: 'Value',
            formula: undefined,
            scalarValue: 'Value',
            displayValue: 'Value',
          },
        ],
        [
          {
            address: 'A2',
            serialized: 'Revenue',
            formula: undefined,
            scalarValue: 'Revenue',
            displayValue: 'Revenue',
          },
          {
            address: 'B2',
            serialized: '=Inputs!B2*Inputs!B3',
            formula: '=Inputs!B2*Inputs!B3',
            value: { tag: 1, value: 24000 },
            scalarValue: 24000,
            displayValue: '24000',
          },
        ],
      ],
    });
    expect(result.rows[1]?.[1]?.value).toEqual({ tag: 1, value: 24000 });
  });

  it('sets an input and verifies dependent readback through the Bilig runtime', async () => {
    const result = await biligWorkpaperUtils.setCellAndVerify({
      workpaper: biligWorkpaperUtils.createDemoWorkpaper(),
      sheet: 'Inputs',
      cell: 'B2',
      value: '32',
      readbackCell: 'B2',
      readbackSheet: 'Summary',
      expectedReadback: '38400',
    });

    expect(result.verified).toBe(true);
    expect(result.updatedCell).toBe('Inputs!B2');
    expect(result.readback).toEqual({
      value: { tag: 1, value: 38400 },
      scalarValue: 38400,
      displayValue: '38400',
    });
    expect(result.workpaper.sheets[0]?.content[1]?.[1]).toBe(32);
  });

  it('also accepts a compact sheets-map WorkPaper shape', async () => {
    const result = await biligWorkpaperUtils.setCellAndVerify({
      workpaper: {
        sheets: {
          Sheet1: [
            [10, 20, '=SUM(A1:B1)'],
            [30, 5, '=IF(B2>5,"ok","low")'],
          ],
        },
      },
      sheet: 'Sheet1',
      cell: 'B2',
      value: '7',
      readbackCell: 'C2',
      readbackSheet: 'Sheet1',
      expectedReadback: 'ok',
    });

    expect(result.verified).toBe(true);
    expect(result.readback.scalarValue).toBe('ok');
  });

  it('normalizes padded scalar input before writing it', async () => {
    const result = await biligWorkpaperUtils.setCellAndVerify({
      workpaper: biligWorkpaperUtils.createDemoWorkpaper(),
      sheet: 'Inputs',
      cell: 'B2',
      value: '  unquoted text  ',
      expectedReadback: 'unquoted text',
    });

    expect(result.verified).toBe(true);
    expect(result.readback.scalarValue).toBe('unquoted text');
  });

  it('reports a clear error when the input address targets another sheet', async () => {
    await expect(
      biligWorkpaperUtils.setCellAndVerify({
        workpaper: biligWorkpaperUtils.createDemoWorkpaper(),
        sheet: 'Inputs',
        cell: 'Summary!B2',
        value: '32',
      })
    ).rejects.toThrow('Expected cell address on sheet "Inputs", got "Summary".');
  });
});
