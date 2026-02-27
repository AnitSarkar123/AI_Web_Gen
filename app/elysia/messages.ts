import Elysia from "elysia";

export const messages = new Elysia({ prefix: '/messages' })
    .get('/', async () => {
        return { message: 'Hello, World Elysia!' }
    })