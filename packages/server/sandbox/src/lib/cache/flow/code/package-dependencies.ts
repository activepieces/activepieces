function isRegistryDependency(name: string, version: unknown): boolean {
    if (typeof version !== 'string') {
        return false
    }
    const trimmed = version.trim()
    if (trimmed.length === 0) {
        return false
    }
    const nameAllowed = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i
    const versionAllowed = /^[\w.\-+~^><=|* ]+$/
    return nameAllowed.test(name) && versionAllowed.test(trimmed)
}

function sanitize(dependencies: unknown): Record<string, string> {
    if (typeof dependencies !== 'object' || dependencies === null || Array.isArray(dependencies)) {
        return {}
    }
    const entries = Object.entries(dependencies).filter(([name, version]) => isRegistryDependency(name, version))
    return Object.fromEntries(entries.map(([name, version]) => [name, String(version).trim()]))
}

export const packageDependencies = { sanitize, isRegistryDependency }
