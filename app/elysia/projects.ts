import Elysia from "elysia";

export const projects = new Elysia({ prefix: '/projects' })
    .post('/', async () => {
        return { message: 'Hello, World Elysia projects!' }
    })