export const systemConstants = {
    PACKAGE_ARCHIVE_PATH: 'cache/archives',
    POLLING_POOL_SIZE: 5,
    ENGINE_EXECUTABLE_PATH: 'dist/packages/engine/main.js',
}

export enum PiecesSource {
    /**
   * @deprecated Use `DB`, as `CLOUD_AND_DB` is no longer supported.
   */
    CLOUD_AND_DB = 'CLOUD_AND_DB',
    DB = 'DB',
    FILE = 'FILE',
}