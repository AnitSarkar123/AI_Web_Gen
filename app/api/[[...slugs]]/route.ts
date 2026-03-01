import { Elysia, t } from 'elysia'

import { messages } from '@/app/elysia/messages';
import { projects } from '@/app/elysia/projects';

const app = new Elysia({ prefix: '/api' }).use([    messages, projects])
    

export const GET = app.fetch 
export const POST = app.fetch 
export const PUT =app.fetch;
export const DELETE = app.fetch;
export const PATCH =app.fetch;
export const OPTIONS =app.fetch;

export type App = typeof app;