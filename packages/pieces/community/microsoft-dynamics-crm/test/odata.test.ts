import { describe, expect, it } from 'vitest';
import { odata } from '../src/lib/common/odata';

describe('odata helpers', () => {
  it('validates and normalizes GUIDs', () => {
    expect(odata.requireGuid({ value: '{6F3C6D2A-4B1E-EF11-8406-000D3A4F1234}', label: 'ID' })).toBe('6f3c6d2a-4b1e-ef11-8406-000d3a4f1234');
    expect(() => odata.requireGuid({ value: "x') or 1 eq 1", label: 'ID' })).toThrow(/GUID/);
  });

  it('escapes single quotes and rejects path-unsafe identifiers', () => {
    expect(odata.escapeString("O'Brien")).toBe("O''Brien");
    expect(() => odata.requireIdentifier({ value: 'contacts/../x', label: 'Set' })).toThrow();
  });

  it('flattens annotations into readable keys', () => {
    expect(
      odata.flattenRecord({
        '@odata.etag': 'W/"1"',
        statecode: 0,
        'statecode@OData.Community.Display.V1.FormattedValue': 'Active',
        '_ownerid_value@Microsoft.Dynamics.CRM.lookuplogicalname': 'systemuser',
        '_ownerid_value@Microsoft.Dynamics.CRM.associatednavigationproperty': 'ownerid',
      })
    ).toEqual({ etag: 'W/"1"', statecode: 0, statecode_formatted: 'Active', _ownerid_value_entity: 'systemuser' });
  });

  it('drops only undefined and empty strings from fields', () => {
    expect(odata.compactFields({ a: undefined, b: '', c: null, d: 0, e: false })).toEqual({ c: null, d: 0, e: false });
  });

  it('injects page and escaped paging cookie into the fetch element', () => {
    const result = odata.applyFetchPaging({
      fetchXml: '<fetch count="2" page="1"><entity name="account"/></fetch>',
      page: 2,
      pagingCookie: '<cookie page="1"><accountid last="{X}" /></cookie>',
    });
    expect(result).toBe('<fetch count="2" page="2" paging-cookie="&lt;cookie page=&quot;1&quot;&gt;&lt;accountid last=&quot;{X}&quot; /&gt;&lt;/cookie&gt;"><entity name="account"/></fetch>');
    expect(() => odata.applyFetchPaging({ fetchXml: '<entity/>' })).toThrow(/<fetch>/);
  });

  it('shapes a record: flat keys, declared keys filled with null, id and entity set added', () => {
    expect(
      odata.shapeRecord({
        record: { '@odata.context': 'x', '@odata.etag': 'W/"2"', contactid: 'c1', firstname: 'A' },
        keys: ['contactid', 'firstname', 'telephone1'],
        primaryId: 'contactid',
        entitySet: 'contacts',
      })
    ).toEqual({ contactid: 'c1', firstname: 'A', telephone1: null, etag: 'W/"2"', id: 'c1', entitySet: 'contacts' });
  });

  it('escapes LIKE wildcards for contains only', () => {
    expect(odata.escapeContains("100%off_[x]'s")).toBe("100[%]off[_][[]x]''s");
  });

  it('passes the attachment MIME type from the file name', () => {
    expect(odata.readFile({ filename: 'Quote.PDF', base64: 'eA==' })).toEqual({ filename: 'Quote.PDF', base64: 'eA==', mimeType: 'application/pdf' });
    expect(odata.readFile({ filename: 'notes', data: Buffer.from('x') })).toEqual({ filename: 'notes', base64: 'eA==', mimeType: undefined });
  });
});
