process.send({ env: process.env, execArgv: process.execArgv })
setTimeout(() => process.exit(0), 1000)
