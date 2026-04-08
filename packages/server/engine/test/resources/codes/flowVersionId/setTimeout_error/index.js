module.exports = {
    code: async (inputs) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                JSON.parse('this is not json')
            }, 10)
        })
    },
}
