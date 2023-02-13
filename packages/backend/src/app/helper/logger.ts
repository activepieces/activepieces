import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      colorize: true,
      ignore: 'pid,hostname',
    },
  },
})
