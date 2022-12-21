import * as Koa from 'koa';
import {StatusCodes} from "http-status-codes";

const app:Koa = new Koa();

// Generic error handling middleware.
app.use(async (ctx: Koa.Context, next: () => Promise<any>) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.statusCode || error.status || StatusCodes.INTERNAL_SERVER_ERROR;
    error.status = ctx.status;
    ctx.body = { error };
    ctx.app.emit('error', error, ctx);
  }
});

// Initial route
app.use(async (ctx:Koa.Context) => {
  ctx.body = 'Hello world';
});

// Application error logging.
app.on('error', console.error);

export default app;