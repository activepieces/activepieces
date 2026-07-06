import fs from 'node:fs'

const rows = JSON.parse(fs.readFileSync('/tmp/ap-bundle-results.json', 'utf8'))
const fmt = (b) => b == null ? '—' : (b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / 1024 / 1024).toFixed(2) + ' MB')

const ok = rows.filter((r) => r.bundled?.ok).map((r) => ({
    name: r.pieceName,
    raw: r.raw.total,
    bundled: r.bundled.bundleBytes + r.bundled.externalBytes,
    ext: r.bundled.external,
}))
ok.sort((a, b) => b.raw - a.raw)

const lines = ['| # | Piece | Raw (node_modules) | Bundled | Smaller |', '|--:|---|--:|--:|--:|']
ok.forEach((r, i) => {
    const ratio = r.bundled > 0 ? (r.raw / r.bundled).toFixed(1) + '×' : '—'
    lines.push(`| ${i + 1} | ${r.name}${r.ext.length ? ' ⚙️' : ''} | ${fmt(r.raw)} | ${fmt(r.bundled)} | ${ratio} |`)
})

const rawTotal = ok.reduce((s, r) => s + r.raw, 0)
const bundledTotal = ok.reduce((s, r) => s + r.bundled, 0)
const failed = rows.filter((r) => r.bundled && !r.bundled.ok)

fs.writeFileSync('/tmp/ap-bundle-table.md', lines.join('\n'))

console.log(`Pieces measured: ${ok.length} OK, ${failed.length} failed${failed.length ? ' (' + failed.map((r) => r.pieceName).join(', ') + ')' : ''}`)
console.log(`RAW catalog total:     ${fmt(rawTotal)}`)
console.log(`BUNDLED catalog total: ${fmt(bundledTotal)}`)
console.log(`Reduction: ${(100 * (1 - bundledTotal / rawTotal)).toFixed(1)}%  (${(rawTotal / bundledTotal).toFixed(1)}× smaller)`)
console.log(`\nFull ${ok.length}-row table written to /tmp/ap-bundle-table.md`)
console.log(`\n--- TOP 30 by raw size ---`)
console.log(lines.slice(0, 32).join('\n'))
