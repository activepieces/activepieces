export const code = async () => {
    console.log('stdout line from user code')
    console.error('stderr line from user code')
    throw new Error('Error after logging')
}
