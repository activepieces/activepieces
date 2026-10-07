export const code = async () => {
    return new Promise(() => {
        setTimeout(() => {
            JSON.parse('this is not json')
        }, 10)
    })
}
