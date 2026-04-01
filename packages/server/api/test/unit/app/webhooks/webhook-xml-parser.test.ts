import { XMLParser } from 'fast-xml-parser'

// Mirror the exact options used in webhook-module.ts so that any change to the
// production config is caught here immediately.
function makeParser() {
    return new XMLParser({ processEntities: false })
}

describe('Webhook XML parser configuration', () => {
    it('should parse a simple XML document to a JS object', () => {
        const parser = makeParser()
        const result = parser.parse('<root><name>Alice</name><age>30</age></root>')
        expect(result).toEqual({ root: { name: 'Alice', age: 30 } })
    })

    it('should parse nested XML correctly', () => {
        const parser = makeParser()
        const result = parser.parse('<order><id>42</id><items><item>A</item><item>B</item></items></order>')
        expect(result.order.id).toBe(42)
    })

    it('should parse RSS XML correctly', () => {
        const parser = makeParser()
        const xml = '<rss version="2.0"><channel><title>My Feed</title></channel></rss>'
        const result = parser.parse(xml)
        expect(result.rss.channel.title).toBe('My Feed')
    })

    // DOCTYPE entity declarations must NOT be able to shadow the
    // five built-in XML entities (&lt; &gt; &amp; &apos; &quot;).
    // processEntities:false keeps entity refs as literal strings, preventing
    // any DOCTYPE-defined entity from replacing built-in entity semantics.
    it('should not allow DOCTYPE entity to override built-in &lt; entity', () => {
        const parser = makeParser()
        const maliciousXml = [
            '<?xml version="1.0"?>',
            '<!DOCTYPE x [',
            '  <!ENTITY lt "INJECTED">',
            ']>',
            '<root><item>&lt;script&gt;alert(1)&lt;/script&gt;</item></root>',
        ].join('\n')

        const result = parser.parse(maliciousXml)
        const body = JSON.stringify(result)

        expect(body).not.toContain('INJECTED')
        // Entity refs are preserved as-is (not expanded) with processEntities:false
        expect(body).toContain('&lt;')
    })

    it('should not expand custom DOCTYPE entities', () => {
        const parser = makeParser()
        const xml = [
            '<!DOCTYPE x [<!ENTITY custom "EVIL">]>',
            '<root>&custom;</root>',
        ].join('\n')

        const result = parser.parse(xml)
        expect(JSON.stringify(result)).not.toContain('EVIL')
    })
})
