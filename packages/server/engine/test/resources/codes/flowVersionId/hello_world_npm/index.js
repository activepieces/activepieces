const { greet } = require('hello-world-npm')
module.exports = {
    code: async (params) => {
        return { message: greet(params.name) }
    },
}
