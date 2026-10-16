/// <reference types="vitest/globals" />

import { formatFieldValues } from '../src/lib/common';
import { BaserowFieldType, BaserowLinkBy } from '../src/lib/common/constants';
import { BaserowField } from '../src/lib/common/types';

describe('formatFieldValues', () => {
  describe('link to table fields', () => {
    it('links by row ID by default, from numbers or numeric text', () => {
      const result = formatFieldValues({
        input: { compte_id: ['12', 7, ' 3 '] },
        fields: [linkField({ name: 'compte_id' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ compte_id: [12, 7, 3] });
    });

    it('rejects text in Row ID mode instead of sending null or a truncated number', () => {
      const fields = [linkField({ name: 'compte_id' })];

      expect(() =>
        formatFieldValues({ input: { compte_id: ['L9PnbzEm'] }, fields, skipEmpty: true })
      ).toThrow('Field "compte_id": "L9PnbzEm" is not a row ID');
      expect(() =>
        formatFieldValues({ input: { compte_id: ['9ma8Kx3m'] }, fields, skipEmpty: true })
      ).toThrow('set "compte_id — Link by" to "Primary field value"');
    });

    it('sends every value as text when linking by primary field value, even numeric ones', () => {
      const result = formatFieldValues({
        input: {
          compte_id: ['L9PnbzEm', 1042, ' 1043 '],
          __link_by__compte_id: BaserowLinkBy.PRIMARY_FIELD_VALUE,
        },
        fields: [linkField({ name: 'compte_id' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ compte_id: ['L9PnbzEm', '1042', '1043'] });
    });

    it('accepts a single value instead of a list', () => {
      const result = formatFieldValues({
        input: {
          compte_id: 'L9PnbzEm',
          __link_by__compte_id: BaserowLinkBy.PRIMARY_FIELD_VALUE,
        },
        fields: [linkField({ name: 'compte_id' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ compte_id: ['L9PnbzEm'] });
    });

    it('reads the id or the value out of linked rows copied from another Baserow row', () => {
      const linkedRows = [{ id: 5, value: 'Acme', order: '1.0' }];
      const fields = [linkField({ name: 'compte_id' })];

      expect(
        formatFieldValues({ input: { compte_id: linkedRows }, fields, skipEmpty: true })
      ).toEqual({ compte_id: [5] });
      expect(
        formatFieldValues({
          input: {
            compte_id: linkedRows,
            __link_by__compte_id: BaserowLinkBy.PRIMARY_FIELD_VALUE,
          },
          fields,
          skipEmpty: true,
        })
      ).toEqual({ compte_id: ['Acme'] });
    });

    it('flattens a list mapped into a single list item', () => {
      const result = formatFieldValues({
        input: { compte_id: [['1', '2']] },
        fields: [linkField({ name: 'compte_id' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ compte_id: [1, 2] });
    });

    it('leaves the field untouched when every value is blank, but clears it for Clean Row', () => {
      const fields = [linkField({ name: 'compte_id' })];
      const input = { compte_id: ['', null, '  '] };

      expect(formatFieldValues({ input, fields, skipEmpty: true })).toEqual({});
      expect(formatFieldValues({ input, fields, skipEmpty: false })).toEqual({ compte_id: [] });
    });

    it('never sends the Link by setting to Baserow', () => {
      const result = formatFieldValues({
        input: { compte_id: ['1'], __link_by__compte_id: BaserowLinkBy.ROW_ID },
        fields: [linkField({ name: 'compte_id' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ compte_id: [1] });
    });

    it('keeps a real field whose name starts like a Link by setting', () => {
      const result = formatFieldValues({
        input: { __link_by__notes: 'kept' },
        fields: [textField({ name: '__link_by__notes' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ __link_by__notes: 'kept' });
    });
  });

  describe('date fields', () => {
    it('sends only the date to a date field without time', () => {
      const result = formatFieldValues({
        input: { date_naissance: '1963-01-28T00:00:00.000Z' },
        fields: [dateField({ name: 'date_naissance', includeTime: false })],
        skipEmpty: true,
      });

      expect(result).toEqual({ date_naissance: '1963-01-28' });
    });

    it('keeps the full timestamp for a date field with time', () => {
      const result = formatFieldValues({
        input: { date_debut: '2026-09-09T15:30:00.000Z' },
        fields: [dateField({ name: 'date_debut', includeTime: true })],
        skipEmpty: true,
      });

      expect(result).toEqual({ date_debut: '2026-09-09T15:30:00.000Z' });
    });
  });

  describe('collaborator fields', () => {
    it('accepts numeric user IDs, as numbers or text', () => {
      const result = formatFieldValues({
        input: { assignes: [5, '7', ' 9 '] },
        fields: [collaboratorField({ name: 'assignes' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ assignes: [{ id: 5 }, { id: 7 }, { id: 9 }] });
    });

    it('reads the id out of collaborators copied from another Baserow row', () => {
      const result = formatFieldValues({
        input: { assignes: [{ id: 3, name: 'Jean' }] },
        fields: [collaboratorField({ name: 'assignes' })],
        skipEmpty: true,
      });

      expect(result).toEqual({ assignes: [{ id: 3 }] });
    });

    it('rejects anything that is not a user ID instead of guessing', () => {
      const fields = [collaboratorField({ name: 'assignes' })];

      expect(() =>
        formatFieldValues({ input: { assignes: ['jean@exemple.fr'] }, fields, skipEmpty: true })
      ).toThrow('Field "assignes": "jean@exemple.fr" is not a Baserow user ID');
      expect(() =>
        formatFieldValues({ input: { assignes: ['7-jean'] }, fields, skipEmpty: true })
      ).toThrow('is not a Baserow user ID');
    });

    it('leaves the field untouched when every value is blank, but clears it for Clean Row', () => {
      const fields = [collaboratorField({ name: 'assignes' })];
      const input = { assignes: ['', null] };

      expect(formatFieldValues({ input, fields, skipEmpty: true })).toEqual({});
      expect(formatFieldValues({ input, fields, skipEmpty: false })).toEqual({ assignes: [] });
    });
  });
});

function linkField({ name }: { name: string }): BaserowField {
  return {
    ...commonField({ name }),
    type: BaserowFieldType.LINK_TO_TABLE,
    link_row_table_id: 1140768,
    link_row_related_field_id: 2,
    link_row_table: 1140768,
    link_row_related_field: 2,
  };
}

function collaboratorField({ name }: { name: string }): BaserowField {
  return {
    ...commonField({ name }),
    type: BaserowFieldType.MULTIPLE_COLLABORATORS,
    notify_user_when_added: false,
  };
}

function dateField({ name, includeTime }: { name: string; includeTime: boolean }): BaserowField {
  return {
    ...commonField({ name }),
    type: BaserowFieldType.DATE,
    date_format: 'ISO',
    date_include_time: includeTime,
    date_time_format: '24',
    date_show_tzinfo: false,
    date_force_timezone: null,
  };
}

function textField({ name }: { name: string }): BaserowField {
  return { ...commonField({ name }), type: BaserowFieldType.TEXT, text_default: '' };
}

function commonField({ name }: { name: string }) {
  return { id: 1, table_id: 538335, name, order: 1, primary: false, read_only: false };
}
