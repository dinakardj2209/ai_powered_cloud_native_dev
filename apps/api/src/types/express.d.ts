export {};

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}
