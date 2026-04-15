import path from 'node:path'
import type Parser from 'web-tree-sitter'

const BLOCK_MAX_LINES = 80
const WASM_DIR = path.resolve(__dirname, 'wasm')

let parserReady: Promise<{ tsParser: Parser }> | null = null

function initParser(): Promise<{ tsParser: Parser }> {
    if (!parserReady) {
        parserReady = initParserInternal()
    }
    return parserReady
}

async function initParserInternal(): Promise<{ tsParser: Parser }> {
    const TreeSitter = (await import('web-tree-sitter')).default
    await TreeSitter.init()
    const tsWasm = path.join(WASM_DIR, 'tree-sitter-typescript.wasm')
    const tsLang = await TreeSitter.Language.load(tsWasm)
    const tsParser = new TreeSitter()
    tsParser.setLanguage(tsLang)
    return { tsParser }
}

export const copilotTsParser = {
    async extractChunks({ content, filePath: _filePath }: { content: string, filePath: string }): Promise<ParsedChunk[]> {
        const { tsParser } = await initParser()
        const tree = tsParser.parse(content)

        const chunks: ParsedChunk[] = []
        const claimedLines = new Set<number>()

        extractNodes({
            node: tree.rootNode,
            content,
            chunks,
            claimedLines,
        })

        addUnclaimedBlocks({ content, chunks, claimedLines })

        chunks.sort((a, b) => a.startLine - b.startLine)
        return chunks
    },
}

function extractNodes({ node, content, chunks, claimedLines }: ExtractParams): void {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (!child) continue

        const nodeType = child.type

        if (isFunctionNode(nodeType)) {
            const name = findChildName(child)
            const chunk = buildChunkFromNode({
                node: child,
                content,
                chunkType: 'function',
                functionName: name,
                className: null,
            })
            chunks.push(chunk)
            claimLines(chunk, claimedLines)
        }
        else if (nodeType === 'class_declaration' || nodeType === 'abstract_class_declaration') {
            const name = findChildName(child)
            const chunk = buildChunkFromNode({
                node: child,
                content,
                chunkType: 'class',
                functionName: null,
                className: name,
            })
            chunks.push(chunk)
            claimLines(chunk, claimedLines)
        }
        else if (isTypeNode(nodeType)) {
            const name = findChildName(child)
            const chunk = buildChunkFromNode({
                node: child,
                content,
                chunkType: 'type',
                functionName: name,
                className: null,
            })
            chunks.push(chunk)
            claimLines(chunk, claimedLines)
        }
        else if (nodeType === 'export_statement') {
            const declaration = child.childForFieldName('declaration')
            if (declaration) {
                const declType = declaration.type
                if (isFunctionNode(declType)) {
                    const name = findChildName(declaration)
                    const chunk = buildChunkFromNode({
                        node: child,
                        content,
                        chunkType: 'function',
                        functionName: name,
                        className: null,
                    })
                    chunks.push(chunk)
                    claimLines(chunk, claimedLines)
                }
                else if (declType === 'class_declaration' || declType === 'abstract_class_declaration') {
                    const name = findChildName(declaration)
                    const chunk = buildChunkFromNode({
                        node: child,
                        content,
                        chunkType: 'class',
                        functionName: null,
                        className: name,
                    })
                    chunks.push(chunk)
                    claimLines(chunk, claimedLines)
                }
                else if (isTypeNode(declType)) {
                    const name = findChildName(declaration)
                    const chunk = buildChunkFromNode({
                        node: child,
                        content,
                        chunkType: 'type',
                        functionName: name,
                        className: null,
                    })
                    chunks.push(chunk)
                    claimLines(chunk, claimedLines)
                }
                else if (declType === 'lexical_declaration') {
                    const name = findLexicalName(declaration)
                    const hasArrow = containsNodeType(declaration, 'arrow_function')
                    const hasFn = containsNodeType(declaration, 'function')
                    const chunk = buildChunkFromNode({
                        node: child,
                        content,
                        chunkType: hasArrow || hasFn ? 'function' : 'module',
                        functionName: hasArrow || hasFn ? name : null,
                        className: null,
                    })
                    chunks.push(chunk)
                    claimLines(chunk, claimedLines)
                }
            }
        }
    }
}

function isFunctionNode(type: string): boolean {
    return type === 'function_declaration' || type === 'function_signature'
}

function isTypeNode(type: string): boolean {
    return type === 'type_alias_declaration' || type === 'interface_declaration' || type === 'enum_declaration'
}

function findChildName(node: Parser.SyntaxNode): string | null {
    const nameNode = node.childForFieldName('name')
    return nameNode?.text ?? null
}

function findLexicalName(node: Parser.SyntaxNode): string | null {
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (!child) continue
        if (child.type === 'variable_declarator') {
            return findChildName(child)
        }
    }
    return null
}

function containsNodeType(node: Parser.SyntaxNode, type: string): boolean {
    if (node.type === type) return true
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i)
        if (child && containsNodeType(child, type)) return true
    }
    return false
}

function buildChunkFromNode({ node, content, chunkType, functionName, className }: BuildChunkParams): ParsedChunk {
    const startLine = node.startPosition.row + 1
    const endLine = node.endPosition.row + 1
    const text = content.slice(node.startIndex, node.endIndex)
    return {
        content: text,
        startLine,
        endLine,
        functionName,
        className,
        chunkType,
    }
}

function claimLines(chunk: ParsedChunk, claimedLines: Set<number>): void {
    for (let line = chunk.startLine; line <= chunk.endLine; line++) {
        claimedLines.add(line)
    }
}

function addUnclaimedBlocks({ content, chunks, claimedLines }: AddUnclaimedParams): void {
    const lines = content.split('\n')
    let blockStart: number | null = null

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1
        const lineContent = lines[i].trim()
        const isClaimed = claimedLines.has(lineNum)
        const isBlank = lineContent === '' || lineContent.startsWith('import ') || lineContent.startsWith('//')

        if (!isClaimed && !isBlank) {
            if (blockStart === null) blockStart = lineNum
        }
        else if (blockStart !== null) {
            const blockEnd = lineNum - 1
            if (blockEnd - blockStart + 1 > 2) {
                emitBlock({ lines, blockStart, blockEnd, chunks })
            }
            blockStart = null
        }
    }

    if (blockStart !== null) {
        const blockEnd = lines.length
        if (blockEnd - blockStart + 1 > 2) {
            emitBlock({ lines, blockStart, blockEnd: lines.length, chunks })
        }
    }
}

function emitBlock({ lines, blockStart, blockEnd, chunks }: EmitBlockParams): void {
    if (blockEnd - blockStart + 1 <= BLOCK_MAX_LINES) {
        chunks.push({
            content: lines.slice(blockStart - 1, blockEnd).join('\n'),
            startLine: blockStart,
            endLine: blockEnd,
            functionName: null,
            className: null,
            chunkType: 'block',
        })
        return
    }

    let start = blockStart
    while (start <= blockEnd) {
        const end = Math.min(start + BLOCK_MAX_LINES - 1, blockEnd)
        chunks.push({
            content: lines.slice(start - 1, end).join('\n'),
            startLine: start,
            endLine: end,
            functionName: null,
            className: null,
            chunkType: 'block',
        })
        start = end + 1
    }
}

type ParsedChunk = {
    content: string
    startLine: number
    endLine: number
    functionName: string | null
    className: string | null
    chunkType: 'function' | 'class' | 'block' | 'module' | 'type'
}

type ExtractParams = {
    node: Parser.SyntaxNode
    content: string
    chunks: ParsedChunk[]
    claimedLines: Set<number>
}

type BuildChunkParams = {
    node: Parser.SyntaxNode
    content: string
    chunkType: ParsedChunk['chunkType']
    functionName: string | null
    className: string | null
}

type AddUnclaimedParams = {
    content: string
    chunks: ParsedChunk[]
    claimedLines: Set<number>
}

type EmitBlockParams = {
    lines: string[]
    blockStart: number
    blockEnd: number
    chunks: ParsedChunk[]
}

export type { ParsedChunk }
