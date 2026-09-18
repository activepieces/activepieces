import { describe, expect, it } from 'vitest';

import { airtableCommon } from '../src/lib/common';
import { AirtableField, AirtableFieldType } from '../src/lib/common/models';

function field(id: string, type: AirtableFieldType): AirtableField {
  return { id, name: id, description: '', type };
}

const tableFields: AirtableField[] = [
  field('fldName', 'singleLineText'),
  field('fldDone', 'checkbox'),
  field('fldTags', 'multipleSelects'),
  field('fldOwner', 'multipleRecordLinks'),
  field('fldPhoto', 'multipleAttachments'),
  field('fldNotes', 'aiText'),
];

const toggle = airtableCommon.updateToggleKey;

describe('Update Record writes only the fields that are turned on', () => {
  it('writes a field that is turned on', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: { [toggle('fldName')]: true, fldName: 'Acme' },
    });

    expect(written).toEqual({ fldName: 'Acme' });
  });

  it('leaves out a field that is turned off, even when it holds a value', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: {
        [toggle('fldName')]: true,
        fldName: 'Acme',
        [toggle('fldTags')]: false,
        fldTags: ['selPaid'],
      },
    });

    expect(written).toEqual({ fldName: 'Acme' });
  });

  it('never writes a checkbox left untouched by the builder', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: {
        [toggle('fldName')]: true,
        fldName: 'Acme',
        [toggle('fldDone')]: false,
        fldDone: false,
      },
    });

    expect(written).toEqual({ fldName: 'Acme' });
  });

  it.each([
    ['fldName', undefined, null],
    ['fldName', '', null],
    ['fldDone', undefined, false],
    ['fldDone', false, false],
    ['fldTags', [], []],
    ['fldOwner', [], []],
    ['fldPhoto', '', []],
  ])('clears %s when it is turned on and left empty', (id, value, cleared) => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: { [toggle(id)]: true, [id]: value },
    });

    expect(written).toEqual({ [id]: cleared });
  });

  it('turns an attachment URL into the shape Airtable expects', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: {
        [toggle('fldPhoto')]: true,
        fldPhoto: 'https://example.com/logo.png',
      },
    });

    expect(written).toEqual({
      fldPhoto: [{ url: 'https://example.com/logo.png' }],
    });
  });

  it('writes a checkbox turned on and set to false', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: { [toggle('fldDone')]: true, fldDone: false },
    });

    expect(written).toEqual({ fldDone: false });
  });

  it('ignores fields Airtable does not let this piece write', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: { [toggle('fldNotes')]: true, fldNotes: 'anything' },
    });

    expect(written).toEqual({});
  });

  it('writes nothing when no field is turned on', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: { [toggle('fldName')]: false, fldName: 'Acme' },
    });

    expect(written).toEqual({});
  });

  it('writes nothing for a step saved before the toggles existed', () => {
    const written = airtableCommon.buildUpdateFields({
      tableFields,
      fields: { fldName: 'Acme', fldDone: true, fldOwner: ['recOwner'] },
    });

    expect(written).toEqual({});
  });
});
