export enum CachedSandboxState {
    /**
     * Sandbox object was created
     */
    CREATED = 'CREATED',

    /**
     * Init method was called on sandbox
     */
    INITIALIZED = 'INITIALIZED',

    /**
     * Dependencies, pieces, engine were installed on the sandbox, and it's ready to serve requests
     */
    READY = 'READY',
}
