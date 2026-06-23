import { describe, expect, it } from 'vitest'

import { curatedN8nWorkflowTemplateService } from '../../../../src/app/template/curated-n8n-workflow-templates'

describe('curatedN8nWorkflowTemplateService tag filters', () => {
    it('does not return unrelated curated templates for unmatched tags', () => {
        const templates = curatedN8nWorkflowTemplateService.list({
            tags: ['unmatched-tag'],
        })

        expect(templates).toHaveLength(0)
    })
})
