import fastify from 'fastify';

const app = fastify({
    logger: true
});

app.register(jwt, {
    secret: 'supersecret',
    verify: {
        allowedIss: 'activepieces',
    },
    sign: {
        iss: 'activepieces',
        expiresIn: 3600,
    },
    formatUser(payload) {
        return {
            name: 'khaled',
            email: 'khaled@activepieces.com',
            username: '5aled',
            userType: 'GANGSTER',
        };
    }
});

app.addHook('onRequest', async (request, reply) => {
    await request.jwtVerify()
})

app.register(userController);

const start = async () => {
    try {
        await app.listen({ port: 3000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();
