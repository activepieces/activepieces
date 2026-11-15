export const code = async () => {
    const err = new Error('A system error occurred: uv_os_homedir returned ENOENT')
    err.code = 'ERR_SYSTEM_ERROR'
    throw err
}
