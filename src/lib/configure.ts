import { ElasticBeanstalk, S3 as IS3 } from "aws-sdk";
import fsp from 'promise-fs';
import CLI from 'serverless/lib/classes/CLI';

/**
 * Create a new ElasticBeanstalk configuration file.
 *
 * @param {Object} config stack configuration object
 * @param {Object} logger log instance
 *
 * @returns {undefined}
 */
async function createEBConfig(config: any, logger: CLI): Promise<void> {
  const templatePath = `${__dirname}/../../resources/eb.config.yml`;
  const filePath = `${process.cwd()}/.elasticbeanstalk/config.yml`;

  let content = await fsp.readFile(templatePath, 'utf-8');

  // create output dir if not exists
  await fsp.access(`${process.cwd()}/.elasticbeanstalk`);

  const variables = {
    APPLICATION_ENVIRONMENT: config.environmentName,
    APPLICATION_NAME: config.applicationName,
    ENV: config.env,
    KEY: config.key,
    PLATFORM: config.platform,
    REGION: config.region
  };

  Object.keys(variables).forEach((key) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  });

  try {
    await fsp.writeFile(filePath, content);
  } catch (error) {
    logger.log(error);
  }
}

/**
 * Configure docker run configuration file.
 *
 * @param {IS3}    S3     s3 instance
 * @param {Object} config config object
 * @param {Object} logger logger instance
 *
 * @returns {undefined}
 */
async function configureDockerRun(S3: IS3, config: any, logger: CLI): Promise<void> {
  const dockerRunFile = `${process.cwd()}/Dockerrun.aws.json`;
  const runtimeDockerRunFile = `${process.cwd()}/.serverless/Dockerrun.aws.json`;

  let content = await fsp.readFile(dockerRunFile, 'utf-8');

  const variables = {
    BUCKET_NAME: config.bucketName,
    CONFIG_FILE: config.configFile,
    IMAGE: config.image,
    VERSION: config.version
  };

  Object.keys(variables).forEach((key) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  });

  try {
    await fsp.writeFile(runtimeDockerRunFile, content);

    await S3.upload({
      Body: content,
      Bucket: config.bucketName,
      Key: 'Dockerrun.aws.json'
    }).promise();
  } catch (error) {
    logger.log(error);
  }
}

/**
 * Create a new application version.
 *
 * @param {ElasticBeanstalk}    EB     elastic beanstalk instance
 * @param {Object} params update environment parameters
 *
 * @returns {Object} update environment response
 */
async function deployApplicationVersion(EB: ElasticBeanstalk, params: any): Promise<any> {
  return EB.createApplicationVersion(params).promise();
}

/**
 * Configure service for deployment.
 *
 * @returns {undefined}
 */
export default async function configure(): Promise<void> {
  this.logger.log('Configuring ElasticBeanstalk Deployment...');

  const options = {
    applicationName:this.config.applicationName,
    env: this.options.env,
    environmentName: this.config.environmentName,
    key: this.options.key,
    platform: this.config.platform,
    region: this.options.region
  };

  await createEBConfig(options, this.logger);

  if (this.config.docker) {
    let bucketName;
    let configFile;

    const docker = this.config.docker;

    const S3: IS3 = this.getS3Instance(this.serverless, this.options.region);

    if (docker && docker.auth) {
      bucketName = docker.auth.configBucketName;
      configFile = docker.auth.configFile;

      this.logger.log('Uploading docker auth file to S3...');

      await S3.upload({
        Body: await fsp.readFile(configFile, 'utf-8'),
        Bucket: bucketName,
        Key: configFile
      }).promise();

      this.logger.log('docker auth file uploaded to to S3 successfully');
    }

    const dockerConfig = {
      bucketName,
      configFile,
      image: docker.image,
      version: docker.version
    };

    await configureDockerRun(S3, dockerConfig, this.logger);

    const EB: ElasticBeanstalk = this.getElasticBeanstalkInstance(this.serverless, this.options.region);

    const params = {
      ApplicationName: this.config.applicationName,
      SourceBundle: {
        S3Bucket: dockerConfig.bucketName,
        S3Key: 'Dockerrun.aws.json'
      },
      VersionLabel: dockerConfig.version
    };

    await deployApplicationVersion(EB, params);
  }

  // execute custom script if provided
  if (this.config.script) {
    this.logger.log(`Executing custom script command: ${this.config.script}`);

    const script = require(`${process.cwd()}/${this.config.script}`);

    await script(this.serverless, this.config);
  }
}
