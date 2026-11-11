export interface Statement<TParam = any, TResult = any> {
  all(params?: TParam): TResult[];
  get(params?: TParam): TResult | undefined;
  run(params?: TParam): { changes: number; lastInsertRowid: number | bigint };
}

export interface Db {
  prepare<TParam = any, TResult = any>(sql: string): Statement<TParam, TResult>;
  exec(sql: string): void;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
}
