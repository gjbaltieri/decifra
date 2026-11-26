declare module 'cors' {
    import type { RequestHandler } from 'express';
    function cors(options?: Record<string, unknown>): RequestHandler;
    export = cors;
}
