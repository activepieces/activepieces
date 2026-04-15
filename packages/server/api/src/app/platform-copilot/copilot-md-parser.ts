const MAX_SECTION_CHARS = 3000

export const copilotMdParser = {
    extractChunks({ content, filePath: _filePath }: { content: string, filePath: string }): ParsedChunk[] {
        const stripped = stripFrontmatter(stripJsx(content))
        const lines = stripped.split('\n')

        const h2Sections = splitOnHeading(lines, /^## /)
        if (h2Sections.length === 0) {
            return splitBySize(lines, 1)
        }

        const chunks: ParsedChunk[] = []
        for (const section of h2Sections) {
            const sectionText = section.lines.join('\n')
            if (sectionText.length <= MAX_SECTION_CHARS) {
                chunks.push(buildChunk(section.lines, section.startLine))
            }
            else {
                const subChunks = splitLargeSection(section)
                chunks.push(...subChunks)
            }
        }

        return chunks
    },
}

function stripFrontmatter(content: string): string {
    return content.replace(/^---[\s\S]*?---\n?/, '')
}

function stripJsx(content: string): string {
    return content
        .replace(/<(\w+)[^>]*\/>/g, '')
        .replace(/<(\w+)[^>]*>[\s\S]*?<\/\1>/g, '')
}

function splitOnHeading(lines: string[], pattern: RegExp): Section[] {
    const sections: Section[] = []
    let currentStart: number | null = null
    let currentLines: string[] = []

    const flush = (_endExclusive: number) => {
        if (currentStart === null) return
        if (currentLines.length > 0 && currentLines.join('\n').trim().length > 0) {
            sections.push({ lines: currentLines, startLine: currentStart })
        }
        currentStart = null
        currentLines = []
    }

    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
            flush(i)
            currentStart = i + 1
            currentLines = [lines[i]]
        }
        else if (currentStart !== null) {
            currentLines.push(lines[i])
        }
    }

    flush(lines.length)
    return sections
}

function splitLargeSection(section: Section): ParsedChunk[] {
    const h3Sections = splitOnHeading(section.lines, /^### /)
    if (h3Sections.length > 0) {
        const chunks: ParsedChunk[] = []
        for (const sub of h3Sections) {
            const subText = sub.lines.join('\n')
            const absoluteStart = section.startLine + sub.startLine - 1
            if (subText.length <= MAX_SECTION_CHARS) {
                chunks.push(buildChunk(sub.lines, absoluteStart))
            }
            else {
                const paragraphChunks = splitByParagraphs(sub.lines, absoluteStart)
                chunks.push(...paragraphChunks)
            }
        }
        return chunks
    }

    return splitByParagraphs(section.lines, section.startLine)
}

function splitByParagraphs(lines: string[], absoluteStartLine: number): ParsedChunk[] {
    const chunks: ParsedChunk[] = []
    let groupStart = 0
    let groupLines: string[] = []

    const flush = (endExclusive: number) => {
        if (groupLines.length === 0) return
        const content = groupLines.join('\n')
        if (content.trim().length > 0) {
            chunks.push({
                content,
                startLine: absoluteStartLine + groupStart,
                endLine: absoluteStartLine + endExclusive - 1,
                functionName: null,
                className: null,
                chunkType: 'block',
            })
        }
        groupLines = []
    }

    for (let i = 0; i < lines.length; i++) {
        const isParagraphBreak = lines[i].trim() === '' && i > 0 && lines[i - 1].trim() === ''
        if (isParagraphBreak && groupLines.join('\n').length >= MAX_SECTION_CHARS) {
            flush(i)
            groupStart = i + 1
        }
        else {
            if (groupLines.length === 0) groupStart = i
            groupLines.push(lines[i])
        }
    }

    flush(lines.length)
    return chunks
}

function splitBySize(lines: string[], absoluteStartLine: number): ParsedChunk[] {
    const chunks: ParsedChunk[] = []
    let groupStart = 0
    let groupLines: string[] = []

    const flush = (endExclusive: number) => {
        if (groupLines.length === 0) return
        const content = groupLines.join('\n')
        if (content.trim().length > 0) {
            chunks.push({
                content,
                startLine: absoluteStartLine + groupStart,
                endLine: absoluteStartLine + endExclusive - 1,
                functionName: null,
                className: null,
                chunkType: 'block',
            })
        }
        groupLines = []
    }

    for (let i = 0; i < lines.length; i++) {
        if (groupLines.length === 0) groupStart = i
        groupLines.push(lines[i])
        const currentSize = groupLines.join('\n').length
        if (currentSize >= MAX_SECTION_CHARS) {
            flush(i + 1)
            groupStart = i + 1
        }
    }

    flush(lines.length)

    if (chunks.length === 0) {
        return [{
            content: lines.join('\n'),
            startLine: absoluteStartLine,
            endLine: absoluteStartLine + lines.length - 1,
            functionName: null,
            className: null,
            chunkType: 'block',
        }]
    }

    return chunks
}

function buildChunk(lines: string[], startLine: number): ParsedChunk {
    return {
        content: lines.join('\n'),
        startLine,
        endLine: startLine + lines.length - 1,
        functionName: null,
        className: null,
        chunkType: 'block',
    }
}

type Section = {
    lines: string[]
    startLine: number
}

type ParsedChunk = {
    content: string
    startLine: number
    endLine: number
    functionName: string | null
    className: string | null
    chunkType: 'function' | 'class' | 'block' | 'module' | 'type'
}
