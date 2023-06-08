import { defineConfig, type ChangeEvent } from 'turbowatch'

export default defineConfig({
    project: `${__dirname}/packages/pieces`,
    triggers: [
        {
            expression: ['match', '*.ts', 'basename'],
            name: 'build-pieces',
            initialRun: true,
            interruptible: false,
            persistent: false,
            onChange: async ({ spawn, first, files } :ChangeEvent) => {
                if (first) {
                    const pieces = process.env.AP_DEV_PIECES?.split(',').map(p => `pieces-${p}`).join(',')
                    await spawn`nx run-many -t build --projects=${pieces}`
                    return
                }

                const projects = files
                    .map(file => {
                        const fileNameRegex = /^.+pieces\/(?<pieceName>.+)\/src.+$/
                        const matchResult = file.name.match(fileNameRegex)
                        const pieceName = matchResult?.groups?.pieceName
                        return `pieces-${pieceName}`
                    })
                    .filter(Boolean)
                    .join(',')

                await spawn`nx run-many -t build --projects=${projects}`
            },
        },
    ],
    debounce: {
        wait: 1000,
    },
})
