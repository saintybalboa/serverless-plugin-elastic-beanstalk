"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fsp = require("fs-promise");
const path = require("path");
/**
 * List of supported platforms.
 *
 * @see http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.platforms.html
 */
const platforms = {
    go: '64bit Amazon Linux 2017.09 v2.7.6 running Go 1.9',
    java8SE: '64bit Amazon Linux 2017.09 v2.6.6 running Java 8',
    java8Tomcat8: '64bit Amazon Linux 2017.09 v2.7.6 running Tomcat 8 Java 8',
    multiContainerDocker: '64bit Amazon Linux 2017.09 v2.8.4 running Multi-container Docker 17.09.1-ce (Generic)',
    netIIS85: '64bit Windows Server 2016 v1.2.0 running IIS 10.0',
    nodejs: '64bit Amazon Linux 2017.09 v4.4.5 running Node.js',
    packer: '64bit Amazon Linux 2017.09 v2.4.5 running Packer 1.0.3',
    php70: '64bit Amazon Linux 2017.09 v2.6.5 running PHP 7.0',
    php71: '64bit Amazon Linux 2017.09 v2.6.5 running PHP 7.1',
    python34: '64bit Amazon Linux 2017.09 v2.6.5 running Python 3.4',
    python36: '64bit Amazon Linux 2017.09 v2.6.5 running Python 3.6',
    ruby23: '64bit Amazon Linux 2017.09 v2.7.1 running Ruby 2.3 (Puma)',
    singleContainerDocker: '64bit Amazon Linux 2017.09 v2.8.4 running Docker 17.09.1-ce',
};
/**
 * Create a new ElasticBeanstalk configuration file.
 *
 * @param {Object} config stack configuration object
 * @param {Object} logger log instance
 *
 * @returns {undefined}
 */
function createEBConfig(config, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const templatePath = `${__dirname}/../../resources/eb.config.yml`;
        const filePath = `${process.cwd()}/.elasticbeanstalk/config.yml`;
        let content = yield fsp.readFile(templatePath, 'utf-8');
        // create output dir if not exists
        yield fsp.ensureDir(`${process.cwd()}/.elasticbeanstalk`);
        const variables = {
            APPLICATION_ENVIRONMENT: config.environmentName,
            APPLICATION_NAME: config.applicationName,
            ENV: config.env,
            KEY: config.key,
            PLATFORM: platforms[config.platform],
            REGION: config.region,
        };
        Object.keys(variables).forEach((key) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
        });
        try {
            yield fsp.writeFile(filePath, content);
        }
        catch (error) {
            logger.log(error);
        }
    });
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
function configureDockerRun(S3, config, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const dockerRunFile = `${process.cwd()}/Dockerrun.aws.json`;
        const runtimeDockerRunFile = `${process.cwd()}/.serverless/Dockerrun.aws.json`;
        let content = yield fsp.readFile(dockerRunFile, 'utf-8');
        const variables = {
            BUCKET_NAME: config.bucketName,
            CONFIG_FILE: config.configFile,
            IMAGE: config.image,
            VERSION: config.version,
        };
        Object.keys(variables).forEach((key) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
        });
        try {
            yield fsp.writeFile(runtimeDockerRunFile, content);
            yield S3.upload({
                Body: content,
                Bucket: config.bucketName,
                Key: 'Dockerrun.aws.json',
            }).promise();
        }
        catch (error) {
            logger.log(error);
        }
    });
}
/**
 * Create a new application version.
 *
 * @param {ElasticBeanstalk}    EB     elastic beanstalk instance
 * @param {Object} params update environment parameters
 *
 * @returns {Object} update environment response
 */
function deployApplicationVersion(EB, params) {
    return __awaiter(this, void 0, void 0, function* () {
        return EB.createApplicationVersion(params).promise();
    });
}
/**
 * Configure service for deployment.
 *
 * @returns {undefined}
 */
function configure() {
    return __awaiter(this, void 0, void 0, function* () {
        this.logger.log('Configuring ElasticBeanstalk Deployment...');
        const stackOutputs = yield fsp.readJson(path.resolve(`${process.cwd()}/.serverless/stack-config.json`));
        const options = {
            applicationName: stackOutputs[this.config.variables.applicationName],
            env: this.options.env,
            environmentName: stackOutputs[this.config.variables.environmentName],
            key: this.options.key,
            platform: this.config.platform,
            region: this.options.region,
        };
        yield createEBConfig(options, this.logger);
        if (this.config.docker) {
            let bucketName;
            let configFile;
            const docker = this.config.docker;
            const S3 = this.getS3Instance(this.serverless, this.options.region);
            if (docker && docker.auth) {
                bucketName = docker.auth.configBucketName;
                configFile = docker.auth.configFile;
                this.logger.log('Uploading docker auth file to S3...');
                yield S3.upload({
                    Body: yield fsp.readFile(configFile, 'utf-8'),
                    Bucket: bucketName,
                    Key: configFile,
                }).promise();
                this.logger.log('docker auth file uploaded to to S3 successfully');
            }
            const dockerConfig = {
                bucketName,
                configFile,
                image: docker.image,
                version: docker.version,
            };
            yield configureDockerRun(S3, dockerConfig, this.logger);
            const EB = this.getElasticBeanstalkInstance(this.serverless, this.options.region);
            const params = {
                ApplicationName: stackOutputs[this.config.variables.applicationName],
                SourceBundle: {
                    S3Bucket: dockerConfig.bucketName,
                    S3Key: 'Dockerrun.aws.json',
                },
                VersionLabel: dockerConfig.version,
            };
            yield deployApplicationVersion(EB, params);
        }
        // execute custom script if provided
        if (this.config.script) {
            this.logger.log(`Executing custom script command: ${this.config.script}`);
            const script = require(`${process.cwd()}/${this.config.script}`);
            yield script(this.serverless, stackOutputs);
        }
    });
}
exports.default = configure;
