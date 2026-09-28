/// <reference types="vitest/globals" />

import { createXml } from '../src/lib/actions/create-xml';
import { convertXmlToJson } from '../src/lib/actions/convert-xml-to-json';
import { convertJsonToXml } from '../src/lib/actions/convert-json-to-xml';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('createXml', () => {
  describe('lists', () => {
    test('repeats the element for each value in a list', async () => {
      expect(await buildXml({ json: { post: { tags: ['a', 'b'] } } })).toBe('<post><tags>a</tags><tags>b</tags></post>');
    });

    test('wraps a single top-level key that holds a list, so {"tags":["a","b"]} gives one tags element per item', async () => {
      expect(await buildXml({ json: { tags: ['a', 'b'] } })).toBe('<root><tags>a</tags><tags>b</tags></root>');
      expect(await buildXml({ json: { tags: ['a', 'b'] }, rootElement: 'post' })).toBe('<post><tags>a</tags><tags>b</tags></post>');
    });

    test('writes one element per object in a list', async () => {
      expect(await buildXml({ json: { root: { row: [{ c: 1 }, { c: 2, d: 'x' }] } } })).toBe(
        '<root><row><c>1</c></row><row><c>2</c><d>x</d></row></root>',
      );
    });

    test('keeps attributes on each repeated element', async () => {
      expect(await buildXml({ json: { r: { i: [{ '@_n': '1', '#text': 'a' }, { '@_n': '2', '#text': 'b' }] } } })).toBe(
        '<r><i n="1">a</i><i n="2">b</i></r>',
      );
    });

    test('omits the element for an empty list', async () => {
      expect(await buildXml({ json: { r: { items: [], o: {} } } })).toBe('<r><o></o></r>');
    });

    test('writes null items as empty repeated elements', async () => {
      expect(await buildXml({ json: { r: { c: [null, 1] } } })).toBe('<r><c/><c>1</c></r>');
    });
  });

  describe('attributes, text and CDATA', () => {
    test('writes @_ keys as attributes of their parent element', async () => {
      expect(await buildXml({ json: { book: { '@_id': '1', title: 'T' } } })).toBe('<book id="1"><title>T</title></book>');
    });

    test('writes #text next to attributes', async () => {
      expect(await buildXml({ json: { price: { '@_currency': 'USD', '#text': 9.5 } } })).toBe('<price currency="USD">9.5</price>');
    });

    test('writes boolean and number attributes with a value', async () => {
      expect(await buildXml({ json: { input: { '@_checked': true, '@_hidden': false, '@_size': 0 } } })).toBe(
        '<input checked="true" hidden="false" size="0"></input>',
      );
    });

    test('writes namespace declarations and prefixed names', async () => {
      expect(await buildXml({ json: soapEnvelope })).toBe(
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><m:GetPrice xmlns:m="https://example.com/prices"><m:Item>Apples</m:Item></m:GetPrice></soap:Body></soap:Envelope>',
      );
    });

    test('writes a default namespace', async () => {
      expect(await buildXml({ json: { feed: { '@_xmlns': 'http://www.w3.org/2005/Atom', title: 'x' } } })).toBe(
        '<feed xmlns="http://www.w3.org/2005/Atom"><title>x</title></feed>',
      );
    });

    test('writes #cdata as a CDATA section and splits an embedded ]]>', async () => {
      expect(await buildXml({ json: { a: { '#cdata': '<b>bold</b> & more' } } })).toBe('<a><![CDATA[<b>bold</b> & more]]></a>');
      expect(await buildXml({ json: { a: { '#cdata': 'x]]>y' } } })).toBe('<a><![CDATA[x]]]]><![CDATA[>y]]></a>');
    });

    test('supports a custom attribute prefix, text key and CDATA key', async () => {
      expect(
        await buildXml({ json: { price: { $currency: 'USD', _: 9.5, note: { '!c': '<x>' } } }, attributePrefix: '$', textKey: '_', cdataKey: '!c' }),
      ).toBe('<price currency="USD">9.5<note><![CDATA[<x>]]></note></price>');
    });

    test('treats @_ keys as plain names once a custom prefix is set', async () => {
      await expect(buildXml({ json: { a: { '@_id': '1' } }, attributePrefix: '$' })).rejects.toThrow('"@_id" at a.@_id is not a valid XML element name');
    });

    test('wraps top-level attributes or text in the root element', async () => {
      expect(await buildXml({ json: { '@_version': '2', item: 'x' } })).toBe('<root version="2"><item>x</item></root>');
      expect(await buildXml({ json: { '#text': 'hi' } })).toBe('<root>hi</root>');
    });
  });

  describe('escaping and unicode', () => {
    test('escapes special characters in text', async () => {
      expect(await buildXml({ json: { a: `x & y <z> "q" 'r'` } })).toBe('<a>x &amp; y &lt;z&gt; &quot;q&quot; &apos;r&apos;</a>');
    });

    test('escapes special characters in attribute values', async () => {
      expect(await buildXml({ json: { a: { '@_t': `x"y&<>'`, b: 1 } } })).toBe('<a t="x&quot;y&amp;&lt;&gt;&apos;"><b>1</b></a>');
    });

    test('does not double-escape existing entities', async () => {
      expect(await buildXml({ json: { a: '&amp;' } })).toBe('<a>&amp;amp;</a>');
    });

    test('keeps unicode and emoji as-is in text, attributes and names', async () => {
      expect(await buildXml({ json: { name: { '@_e': '😀', '#text': 'café 日本 😀' } } })).toBe('<name e="😀">café 日本 😀</name>');
      expect(await buildXml({ json: { 'café': { 日本: 1 } } })).toBe('<café><日本>1</日本></café>');
    });
  });

  describe('root element and top-level shapes', () => {
    test('keeps a single top-level key as the root', async () => {
      expect(await buildXml({ json: { person: { name: 'Alice', address: { city: 'LA' } } } })).toBe(
        '<person><name>Alice</name><address><city>LA</city></address></person>',
      );
    });

    test('wraps a single top-level key when Root Element is set', async () => {
      expect(await buildXml({ json: { person: { name: 'Alice' } }, rootElement: 'data' })).toBe('<data><person><name>Alice</name></person></data>');
    });

    test('wraps several top-level keys in one root element', async () => {
      expect(await buildXml({ json: { a: 1, b: 2 } })).toBe('<root><a>1</a><b>2</b></root>');
      expect(await buildXml({ json: { a: 1, b: 2 }, rootElement: 'data' })).toBe('<data><a>1</a><b>2</b></data>');
    });

    test('trims Root Element and List Item Element and falls back when blank', async () => {
      expect(await buildXml({ json: [1], rootElement: '  rows ', listItemElement: '  ' })).toBe('<rows><item>1</item></rows>');
    });

    test('wraps a top-level list in root and item elements', async () => {
      expect(await buildXml({ json: [{ a: 1 }, { b: 2 }] })).toBe('<root><item><a>1</a></item><item><b>2</b></item></root>');
    });

    test('uses a custom list item element for a top-level list', async () => {
      expect(await buildXml({ json: [{ a: 1 }, { a: 2 }], rootElement: 'rows', listItemElement: 'row' })).toBe(
        '<rows><row><a>1</a></row><row><a>2</a></row></rows>',
      );
      expect(await buildXml({ json: ['x', 'y'], listItemElement: 'v' })).toBe('<root><v>x</v><v>y</v></root>');
    });

    test('writes an empty root for an empty object or list', async () => {
      expect(await buildXml({ json: {} })).toBe('<root></root>');
      expect(await buildXml({ json: [] })).toBe('<root></root>');
      expect(await buildXml({ json: {}, rootElement: 'data', selfCloseEmptyElements: true })).toBe('<data/>');
    });

    test('wraps a top-level primitive in the root element', async () => {
      expect(await buildXml({ json: 'abc' })).toBe('<root>abc</root>');
      expect(await buildXml({ json: 0 })).toBe('<root>0</root>');
      expect(await buildXml({ json: false })).toBe('<root>false</root>');
      expect(await buildXml({ json: '' })).toBe('<root></root>');
    });

    test('writes an empty root for null or undefined', async () => {
      expect(await buildXml({ json: null })).toBe('<root></root>');
      expect(await buildXml({ json: undefined })).toBe('<root></root>');
      expect(await buildXml({ json: null, rootElement: 'data' })).toBe('<data></data>');
    });
  });

  describe('declaration and formatting', () => {
    test('adds the XML declaration when asked', async () => {
      expect(await buildXml({ json: { a: 1 }, includeDeclaration: true })).toBe('<?xml version="1.0" encoding="UTF-8"?><a>1</a>');
    });

    test('leaves the declaration out by default', async () => {
      expect(await buildXml({ json: { a: 1 } })).toBe('<a>1</a>');
    });

    test('uses a ?xml key instead of the default declaration and does not duplicate it', async () => {
      const json = { '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8', '@_standalone': 'yes' }, a: 1 };
      const expected = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a>1</a>';
      expect(await buildXml({ json, includeDeclaration: true })).toBe(expected);
      expect(await buildXml({ json, includeDeclaration: false })).toBe(expected);
    });

    test('keeps a ?xml key outside the root element it wraps around', async () => {
      expect(await buildXml({ json: { '?xml': { '@_version': '1.0' }, a: 1, b: 2 }, includeDeclaration: true })).toBe(
        '<?xml version="1.0"?><root><a>1</a><b>2</b></root>',
      );
      expect(await buildXml({ json: { '?xml': { '@_version': '1.0' }, a: [1, 2] } })).toBe('<?xml version="1.0"?><root><a>1</a><a>2</a></root>');
    });

    test('pretty prints with two-space indentation', async () => {
      expect(await buildXml({ json: { r: { a: 1, b: { c: [1, 2] } } }, prettyPrint: true, includeDeclaration: true })).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n<r>\n  <a>1</a>\n  <b>\n    <c>1</c>\n    <c>2</c>\n  </b>\n</r>',
      );
    });

    test('pretty prints a ?xml declaration on its own line', async () => {
      expect(await buildXml({ json: { '?xml': { '@_version': '1.0' }, a: 1 }, prettyPrint: true, includeDeclaration: true })).toBe(
        '<?xml version="1.0"?>\n<a>1</a>',
      );
    });

    test('keeps newlines inside text when pretty printing', async () => {
      expect(await buildXml({ json: { r: { a: 'x\ny' } }, prettyPrint: true })).toBe('<r>\n  <a>x\ny</a>\n</r>');
    });

    test('adds the declaration when the document starts with another processing instruction', async () => {
      const json = { '?xml-stylesheet': { '@_type': 'text/xsl', '@_href': 's.xsl' }, rss: { a: 1 } };
      expect(await buildXml({ json, includeDeclaration: true })).toBe(
        '<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="s.xsl"?><rss><a>1</a></rss>',
      );
    });

    test('writes a ?xml key first even when another instruction comes before it', async () => {
      const json = { '?pi': { '@_a': '1' }, '?xml': { '@_version': '1.0' }, r: { a: 1 } };
      expect(await buildXml({ json })).toBe('<?xml version="1.0"?><?pi a="1"?><r><a>1</a></r>');
      expect(await buildXml({ json, includeDeclaration: true })).toBe('<?xml version="1.0"?><?pi a="1"?><r><a>1</a></r>');
    });

    test('writes instructions before the root element even when the root key comes first', async () => {
      const json = { r: { a: 1 }, '?pi': { '@_a': '1' }, '?xml': { '@_version': '1.0' } };
      expect(await buildXml({ json })).toBe('<?xml version="1.0"?><?pi a="1"?><r><a>1</a></r>');
    });

    test('keeps an element that mixes text and child elements on one line when pretty printing', async () => {
      const json = { doc: { title: 'T', p: { '@_x': '1', '#text': 'Hello ', b: 'world' } } };
      expect(await buildXml({ json, prettyPrint: true })).toBe('<doc>\n  <title>T</title>\n  <p x="1">Hello <b>world</b></p>\n</doc>');
      expect(await parseXml({ xml: await buildXml({ json, prettyPrint: true }) })).toEqual(await parseXml({ xml: await buildXml({ json }) }));
    });

    test('keeps CDATA inside its element when pretty printing', async () => {
      const json = { r: { a: 1, note: { '#cdata': 'raw <b>html</b>' } } };
      expect(await buildXml({ json, prettyPrint: true })).toBe('<r>\n  <a>1</a>\n  <note><![CDATA[raw <b>html</b>]]></note>\n</r>');
    });

    test('keeps each mixed item of a list on one line and escapes its text', async () => {
      const json = { r: { p: [{ '#text': 'a & b ', i: 'x' }, { '#text': 'c', i: 'y' }] } };
      expect(await buildXml({ json, prettyPrint: true })).toBe('<r>\n  <p>a &amp; b <i>x</i></p>\n  <p>c<i>y</i></p>\n</r>');
    });

    test('leaves user text that looks like the internal placeholder alone', async () => {
      const json = { r: { a: 'apinlinexml0_', p: { '#text': 'mixed ', b: 'bold' } } };
      expect(await buildXml({ json, prettyPrint: true })).toBe('<r>\n  <a>apinlinexml0_</a>\n  <p>mixed <b>bold</b></p>\n</r>');
    });

    test('never mistakes user text for the internal placeholder, whatever it contains', async () => {
      const lookalikes = Array.from({ length: 12 }, (_, index) => `apinlinexml${'x'.repeat(index)}0_`);
      const json = { r: { a: lookalikes, p: { '#text': 'mixed ', b: 'bold' } } };
      const expected = ['<r>', ...lookalikes.map((text) => `  <a>${text}</a>`), '  <p>mixed <b>bold</b></p>', '</r>'].join('\n');
      expect(await buildXml({ json, prettyPrint: true })).toBe(expected);
      expect(await buildXml({ json: { apinlinexml0_: { '#text': 'x ', b: 'y' } }, prettyPrint: true })).toBe('<apinlinexml0_>x <b>y</b></apinlinexml0_>');
    });

    test('keeps a self-closed empty CDATA element self-closed when pretty printing', async () => {
      expect(await buildXml({ json: { r: { a: 1, n: { '#cdata': null } } }, prettyPrint: true, selfCloseEmptyElements: true })).toBe('<r>\n  <a>1</a>\n  <n/>\n</r>');
    });

    test('Pretty Print only adds line breaks and indentation between tags', async () => {
      const random = seededRandom({ seed: 7 });
      for (let index = 0; index < 500; index++) {
        const json = { r: randomNode({ random, depth: 0 }) };
        for (const selfCloseEmptyElements of [false, true]) {
          const compact = await buildXml({ json, selfCloseEmptyElements }).catch(() => undefined);
          if (compact === undefined) {
            continue;
          }
          const pretty = await buildXml({ json, prettyPrint: true, selfCloseEmptyElements });
          expect(pretty.replace(/>\n\s*</g, '><')).toBe(compact);
        }
      }
    });

    test('still enforces the depth limit inside a mixed element', async () => {
      await expect(buildXml({ json: { r: { '#text': 't', deep: nest({ depth: 120 }) } }, prettyPrint: true })).rejects.toThrow('100 levels');
    });
  });

  describe('empty and scalar values', () => {
    test('writes null as a self-closed element and empty string as an open-close pair', async () => {
      expect(await buildXml({ json: { r: { a: null, c: '' } } })).toBe('<r><a/><c></c></r>');
    });

    test('skips undefined values', async () => {
      expect(await buildXml({ json: { r: { a: 1, b: undefined } } })).toBe('<r><a>1</a></r>');
    });

    test('self-closes every empty element when asked', async () => {
      expect(await buildXml({ json: { r: { a: null, c: '', o: {}, x: { '@_id': '1' } } }, selfCloseEmptyElements: true })).toBe(
        '<r><a/><c/><o/><x id="1"/></r>',
      );
    });

    test('writes booleans and numbers as text', async () => {
      expect(await buildXml({ json: { r: { t: true, f: false, zero: 0, n: 1.5, neg: -3, big: 12345678901234 } } })).toBe(
        '<r><t>true</t><f>false</f><zero>0</zero><n>1.5</n><neg>-3</neg><big>12345678901234</big></r>',
      );
    });

    test('writes nested nulls as empty elements', async () => {
      expect(await buildXml({ json: { r: { a: { b: null, c: { d: null } } } } })).toBe('<r><a><b/><c><d/></c></a></r>');
    });

    test('keeps leading-zero strings as written', async () => {
      expect(await buildXml({ json: { r: { zip: '02134', id: '007' } } })).toBe('<r><zip>02134</zip><id>007</id></r>');
    });
  });

  describe('awkward key names', () => {
    test('handles a key named length', async () => {
      expect(await buildXml({ json: { a: { length: 3 } } })).toBe('<a><length>3</length></a>');
      expect(await buildXml({ json: { length: 3 } })).toBe('<length>3</length>');
    });

    test('handles __proto__ and constructor keys without touching the prototype', async () => {
      expect(await buildXml({ json: JSON.parse('{"r":{"__proto__":{"x":1},"constructor":2}}') })).toBe(
        '<r><__proto__><x>1</x></__proto__><constructor>2</constructor></r>',
      );
      expect(await buildXml({ json: JSON.parse('{"__proto__":{"polluted":true}}') })).toBe('<__proto__><polluted>true</polluted></__proto__>');
      expect(Object.prototype).not.toHaveProperty('polluted');
    });

    test('handles keys named after Object methods', async () => {
      expect(await buildXml({ json: { r: { hasOwnProperty: 1, toString: 2, valueOf: 3 } } })).toBe(
        '<r><hasOwnProperty>1</hasOwnProperty><toString>2</toString><valueOf>3</valueOf></r>',
      );
    });
  });

  describe('invalid names', () => {
    test('fails with the key, its path and the line on an element name with a space', async () => {
      const error = await buildXml({ json: { r: { ok: 1, 'bad key': 1 } } }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).toContain('InvalidXmlError');
      expect(String(error)).toContain('does not produce valid XML');
      expect(String(error)).toContain('"bad key" at r.bad key is not a valid XML element name');
      expect(String(error)).toContain('(line 1)');
    });

    test('reports the line of the bad element when pretty printing', async () => {
      await expect(buildXml({ json: { r: { a: 1, b: 2, '1st': 3 } }, prettyPrint: true })).rejects.toThrow('(line 4)');
    });

    test('fails on an element name that starts with a digit', async () => {
      await expect(buildXml({ json: { r: { '1st': 1 } } })).rejects.toThrow(/"1st" at r\.1st is not a valid XML element name\. Tag '1st' is an invalid name\. \(line 1\)/);
    });

    test('fails on an invalid attribute name', async () => {
      await expect(buildXml({ json: { r: { '@_bad attr': 1 } } })).rejects.toThrow('"bad attr" at r.@_bad attr is not a valid XML attribute name');
    });

    test('fails on an empty key, a key with symbols and an invalid root element', async () => {
      await expect(buildXml({ json: { r: { '': 1 } } })).rejects.toThrow('is not a valid XML element name');
      await expect(buildXml({ json: { r: { 'a$b': 1 } } })).rejects.toThrow('"a$b" at r.a$b is not a valid XML element name');
      await expect(buildXml({ json: { a: 1 }, rootElement: 'bad root' })).rejects.toThrow('"bad root" at bad root is not a valid XML element name');
    });

    test('fails on a list directly inside a list', async () => {
      await expect(buildXml({ json: { m: { row: [[1, 2], [3]] } } })).rejects.toThrow('The list at m.row[0] sits directly inside another list');
    });

    test('finds a bad name deep inside a list of objects', async () => {
      await expect(buildXml({ json: { r: { row: [{ ok: 1 }, { deep: { 'no good': 1 } }] } } })).rejects.toThrow(
        '"no good" at r.row[1].deep.no good is not a valid XML element name',
      );
    });
  });

  describe('size and depth', () => {
    test('builds 99 levels of nesting quickly', async () => {
      const started = performance.now();
      const xml = await buildXml({ json: nest({ depth: 99 }) });
      expect(performance.now() - started).toBeLessThan(1000);
      expect(xml.startsWith('<n><n><n>')).toBe(true);
      expect(xml.match(/<n>/g)).toHaveLength(99);
      expect(await parseXml({ xml })).toEqual(nest({ depth: 99 }));
    });

    test('fails fast with a clear error past 100 levels of nesting', async () => {
      const started = performance.now();
      await expect(buildXml({ json: nest({ depth: 100 }) })).rejects.toThrow('nested more than 100 levels deep');
      await expect(buildXml({ json: nest({ depth: 5000 }) })).rejects.toThrow('nested more than 100 levels deep');
      expect(performance.now() - started).toBeLessThan(1000);
    });

    test('builds 60 levels of nesting quickly with pretty print and round-trips it', async () => {
      const json = nest({ depth: 60 });
      const started = performance.now();
      const xml = await buildXml({ json, prettyPrint: true });
      expect(performance.now() - started).toBeLessThan(1000);
      expect(await parseXml({ xml })).toEqual(json);
    });

    test('pretty prints an object with 10,000 keys and mixed content quickly', async () => {
      const wide = Object.fromEntries(Array.from({ length: 10_000 }, (_, index) => [`k${index}`, { '#text': `t${index} `, b: index }]));
      const started = performance.now();
      const xml = await buildXml({ json: { r: wide }, prettyPrint: true });
      expect(performance.now() - started).toBeLessThan(5000);
      expect(xml).toContain('\n  <k9999>t9999 <b>9999</b></k9999>\n');
    });

    test('builds a list of 10,000 items', async () => {
      const rows = Array.from({ length: 10_000 }, (_, index) => ({ '@_id': String(index), name: `row ${index}`, code: `C-${index}` }));
      const started = performance.now();
      const xml = await buildXml({ json: { rows: { row: rows } } });
      expect(performance.now() - started).toBeLessThan(5000);
      expect(xml.match(/<row /g)).toHaveLength(10_000);
      expect(xml.endsWith('<row id="9999"><name>row 9999</name><code>C-9999</code></row></rows>')).toBe(true);
      expect(await parseXml({ xml })).toEqual({ rows: { row: rows } });
    });
  });

  describe('round-trips with Convert XML to JSON', () => {
    test.each([
      ['attributes and repeated objects', { catalog: { book: [{ '@_id': '1', title: 'Dune', price: 9.5 }, { '@_id': '2', title: 'Emma', price: 7 }] } }],
      ['repeated values', { root: { tag: ['a', 'b', 'c'] } }],
      ['text next to an attribute', { price: { '@_currency': 'USD', '#text': 9.5 } }],
      ['namespaces in a SOAP envelope', soapEnvelope],
      ['escaping in text and attributes', { note: { '@_title': `x"y&<>'`, text: `x & y <z> "q" 'r'` } }],
      ['unicode and emoji', { note: { '@_lang': '日本', name: 'café 日本 😀' } }],
      ['booleans, zero and negative numbers', { flags: { on: true, off: false, zero: 0, neg: -2.5 } }],
      ['empty string', { root: { a: '' } }],
      ['nested objects', { a: { b: { c: { d: 'deep' } } } }],
    ])('JSON to XML to JSON: %s', async (_name, json) => {
      expect(await parseXml({ xml: await buildXml({ json }) })).toEqual(json);
      expect(await parseXml({ xml: await buildXml({ json, prettyPrint: true, includeDeclaration: true }) })).toEqual(json);
      expect(await parseXml({ xml: await buildXml({ json, selfCloseEmptyElements: true }) })).toEqual(json);
    });

    test('CDATA content survives, but comes back as plain text', async () => {
      const xml = await buildXml({ json: { a: { '#cdata': '<b>bold</b> & more' } } });
      expect(await parseXml({ xml })).toEqual({ a: '<b>bold</b> & more' });
    });

    test('leading zeros are written, but Convert XML to JSON reads them back as numbers', async () => {
      const xml = await buildXml({ json: { address: { zip: '02134' } } });
      expect(xml).toBe('<address><zip>02134</zip></address>');
      expect(await parseXml({ xml })).toEqual({ address: { zip: 2134 } });
    });

    test('shapes Convert XML to JSON cannot give back unchanged', async () => {
      expect(await parseXml({ xml: await buildXml({ json: { r: { tag: ['only'] } } }) })).toEqual({ r: { tag: 'only' } });
      expect(await parseXml({ xml: await buildXml({ json: { r: { id: '123', ratio: '1.50', yes: 'true' } } }) })).toEqual({ r: { id: 123, ratio: 1.5, yes: true } });
      expect(await parseXml({ xml: await buildXml({ json: { r: { '@_n': 5 } } }) })).toEqual({ r: { '@_n': '5' } });
      expect(await parseXml({ xml: await buildXml({ json: { r: { a: null, b: {}, c: [] } } }) })).toEqual({ r: { a: '', b: '' } });
      await expect(parseXml({ xml: await buildXml({ json: JSON.parse('{"r":{"__proto__":1}}') }) })).rejects.toThrow('prototype pollution');
    });

    test('XML to JSON to XML', async () => {
      const xml =
        '<catalog><book id="1" lang="en"><title>Dune</title><tag>x</tag><tag>y</tag></book><book id="2"><title>Emma &amp; co</title><price currency="EUR">7</price></book></catalog>';
      expect(await buildXml({ json: await parseXml({ xml }) })).toBe(xml);
    });

    test('XML to JSON to XML for a SOAP envelope with a declaration', async () => {
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><m:GetPrice xmlns:m="https://example.com/prices"><m:Item>Apples &amp; Pears</m:Item><m:Zip>SW1A 1AA</m:Zip></m:GetPrice></soap:Body></soap:Envelope>';
      expect(await buildXml({ json: await parseXml({ xml }), includeDeclaration: true })).toBe(xml);
    });
  });
});

describe('convertJsonToXml keeps its output unchanged', () => {
  test.each([
    ['merges list items into one element', { tags: ['a', 'b'] }, undefined, undefined, '<tags>ab</tags>'],
    [
      'copies the attr object onto every child and adds a header',
      { person: { name: 'Alice', attr: { id: '1' }, age: 30 } },
      undefined,
      true,
      '<?xml version="1.0" encoding="UTF-8"?><person><name id="1">Alice</name><age id="1">30</age></person>',
    ],
    [
      'escapes text but not attribute values',
      { note: { text: `x & y <z> "q"`, attr: { t: `a"b&` } } },
      undefined,
      undefined,
      '<note><text t="a"b&">x &amp; y &lt;z&gt; &quot;q&quot;</text></note>',
    ],
    ['flattens a list of objects', { rows: [{ c: 1 }, { c: 2 }] }, undefined, undefined, '<rows><c>1</c><c>2</c></rows>'],
    ['uses a custom attribute key', { item: { meta: { lang: 'en' }, v: null, e: '' } }, 'meta', false, '<item><v lang="en"/><e lang="en"/></item>'],
  ])('%s', async (_name, json, attributesKey, header, expected) => {
    const ctx = createMockActionContext<typeof convertJsonToXml.props>({
      propsValue: { json, attributes_key: attributesKey, header },
    });
    expect(await convertJsonToXml.run(ctx)).toBe(expected);
  });
});

const soapEnvelope = {
  'soap:Envelope': {
    '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
    'soap:Body': { 'm:GetPrice': { '@_xmlns:m': 'https://example.com/prices', 'm:Item': 'Apples' } },
  },
};

async function buildXml({ json, ...options }: BuildXmlParams): Promise<string> {
  const ctx = createMockActionContext<typeof createXml.props>({
    propsValue: {
      rootElement: undefined,
      listItemElement: undefined,
      prettyPrint: false,
      includeDeclaration: false,
      selfCloseEmptyElements: false,
      attributePrefix: undefined,
      textKey: undefined,
      cdataKey: undefined,
      ...options,
      json,
    },
  });
  return String(await createXml.run(ctx));
}

async function parseXml({ xml }: { xml: string }): Promise<unknown> {
  const ctx = createMockActionContext<typeof convertXmlToJson.props>({
    propsValue: { xml, ignoreAttributes: false },
  });
  return convertXmlToJson.run(ctx);
}

function seededRandom({ seed }: { seed: number }): (limit: number) => number {
  let state = seed;
  return (limit) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state % limit;
  };
}

function randomNode({ random, depth }: { random: (limit: number) => number; depth: number }): unknown {
  const values = ['', 'a', 'x & y', ' spaced ', '<b>', 'apinlinexml0_', null, 0, false, 'é😀'];
  if (depth > 4) {
    return values[random(values.length)];
  }
  const kind = random(7);
  if (kind === 0) {
    return values[random(values.length)];
  }
  if (kind === 1) {
    return [randomNode({ random, depth: depth + 1 }), randomNode({ random, depth: depth + 1 })];
  }
  const attribute = random(2) === 1 ? { '@_id': String(random(9)) } : {};
  const text = random(3) === 0 ? { '#text': values[random(values.length)] } : {};
  const cdata = random(4) === 0 ? { '#cdata': [values[random(values.length)], ''][random(2)] } : {};
  const children = Object.fromEntries(
    Array.from({ length: random(3) }, (_, index) => [`${['a', 'b', 'ns:c'][random(3)]}${index || ''}`, randomNode({ random, depth: depth + 1 })]),
  );
  return { ...attribute, ...text, ...cdata, ...children };
}

function nest({ depth }: { depth: number }): Record<string, unknown> {
  return Array.from({ length: depth }).reduce<Record<string, unknown>>((inner) => ({ n: inner }), { v: 'leaf' });
}

type BuildXmlParams = {
  json: unknown;
  rootElement?: string;
  listItemElement?: string;
  prettyPrint?: boolean;
  includeDeclaration?: boolean;
  selfCloseEmptyElements?: boolean;
  attributePrefix?: string;
  textKey?: string;
  cdataKey?: string;
};
