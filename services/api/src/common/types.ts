import type { AppConfig } from '../config/env';

export type AppBindings = {
  Bindings: Env;
  Variables: {
    requestId: string;
    config: AppConfig;
  };
};
