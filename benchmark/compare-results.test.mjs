import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { compareResults } from './compare-results.mjs'

test('reports the median of the rounds and names the worse side', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bench-compare-'))
    const write = ({ name, reqSec, p90Ms, failed }) => writeFileSync(join(dir, name), JSON.stringify({
        latency: { p90Ms },
        throughput: { reqSec },
        counts: { failed },
    }))
    write({ name: 'light-baseline-1.json', reqSec: 100, p90Ms: 50, failed: 0 })
    write({ name: 'light-baseline-2.json', reqSec: 90, p90Ms: 60, failed: 0 })
    write({ name: 'light-baseline-3.json', reqSec: 110, p90Ms: 40, failed: 0 })
    write({ name: 'light-candidate-1.json', reqSec: 80, p90Ms: 50, failed: 2 })
    write({ name: 'light-candidate-2.json', reqSec: 70, p90Ms: 50, failed: 0 })
    write({ name: 'light-candidate-3.json', reqSec: 90, p90Ms: 50, failed: 1 })
    writeFileSync(join(dir, 'light-baseline-1.report.json'), '{}')

    const report = compareResults.renderComparison({ dir, baselineImage: 'img:a', candidateImage: 'img:b' })

    assert.match(report, /\| throughput \(req\/s\) \| 100 \| 80 \| 20\.0% worse \|/)
    assert.match(report, /\| client p90 \(ms\) \| 50 \| 50 \| same \|/)
    assert.match(report, /\| failed requests \(sum\) \| 0 \| 3 \| new \|/)
    assert.match(report, /the candidate failed 3 request\(s\) on the light flow/)
    assert.match(report, /3 round\(s\) per side/)
    assert.doesNotMatch(report, /heavy flow/)
})
