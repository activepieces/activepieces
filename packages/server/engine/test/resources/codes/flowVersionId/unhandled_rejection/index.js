module.exports = {
    code: async (params) => {
        Promise.reject(new Error('Unhandled rejection from user code'))
        return 'returned ok'
    }
}
