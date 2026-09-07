export const code = async () => {
    Promise.reject(new Error('Unhandled rejection from user code'))
    return 'returned ok'
}
