export function mcpToolError(prefix: string, err: unknown): { content: [{ type: 'text', text: string }] } {
    const message = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: `❌ ${prefix}: ${message}` }] }
}
