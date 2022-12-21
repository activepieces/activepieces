import * as Router from 'koa-router';

const routerOpts: Router.IRouterOptions = {
    prefix: '/authentication',
};

const router: Router = new Router(routerOpts);

export default router;