import { treaty } from '@elysiajs/eden'
import  { App } from '../app/api/[[...slugs]]/route'

// .api to enter /api prefix
export const api = treaty<App>('localhost:3000').api