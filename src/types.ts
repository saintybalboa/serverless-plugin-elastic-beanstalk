export interface IBuildConfig {
  folder?: string;
  babel?: boolean;
  sourceMaps?: boolean;
  include?: string[];
}

export interface IPluginConfig {
  applicationName: string;
  environmentName: string;
  solutionStackName: string;
  key: string;
  platform: string;
  bucket: string;
  file?: {
    prefix: string;
    name: string;
  };
  version: string;
  build: IBuildConfig;
}

export interface IElasticBeanstalkCommands {
  'elastic-beanstalk';
}

export interface IElasticBeanstalkHooks {
  'elastic-beanstalk:deploy';
}

export interface IElasticBeanstalk {
  /**
   * Define plugin commands.
   *
   * @returns {IElasticBeanstalkCommands} the commands
   */
  defineCommands(): IElasticBeanstalkCommands;
  /**
   * Define plugin hooks.
   *
   * @returns {IElasticBeanstalkHooks} the hooks
   */
  defineHooks(): IElasticBeanstalkHooks;
}

export interface IElasticBeanstalkOptions {
  env: string;
  key: string;
  region: string;
}
