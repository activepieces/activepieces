const PACKAGE_NAME_REGEX = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i

const VERSION_RANGE_REGEX = /^[\w.\-+~^><=|* ]+$/

function isRegistryDependency({ name, version }: { name: string, version: unknown }): boolean {
    if (typeof version !== 'string') {
        return false
    }
    const trimmed = version.trim()
    if (trimmed.length === 0 || trimmed.startsWith('.')) {
        return false
    }
    return PACKAGE_NAME_REGEX.test(name) && VERSION_RANGE_REGEX.test(trimmed)
}

function sanitize(dependencies: unknown): Record<string, string> {
    if (typeof dependencies !== 'object' || dependencies === null || Array.isArray(dependencies)) {
        return {}
    }
    return Object.fromEntries(
        Object.entries(dependencies)
            .filter(([name, version]) => isRegistryDependency({ name, version }))
            .map(([name, version]) => [name, String(version).trim()]),
    )
}

export const dependencyGuard = { sanitize, isRegistryDependency }
