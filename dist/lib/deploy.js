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
const BPromise = require("bluebird");
const fsp = require("fs-promise");
const path = require("path");
const getVersion_1 = require("./getVersion");
/**
 * Retrieves stack Ouputs from AWS.
 *
 * @returns {undefined}
 */
function deploy() {
    return __awaiter(this, void 0, void 0, function* () {
        this.logger.log('Deploying Application to ElasticBeanstalk...');
        const configPath = `${process.cwd()}/.serverless/stack-config.json`;
        const ebConfig = this.config;
        const config = yield fsp.readJson(configPath);
        ebConfig.version = getVersion_1.default(ebConfig.version);
        const applicationName = config[ebConfig.variables.applicationName];
        const environmentName = config[ebConfig.variables.environmentName];
        const versionLabel = `${applicationName}-${ebConfig.version}`;
        let fileName = `bundle-${versionLabel}.zip`;
        if (ebConfig.file) {
            fileName = ebConfig.file.prefix ? `${ebConfig.file.prefix}/` : '';
            fileName += ebConfig.file.name ? `${ebConfig.file.name}` : `bundle-${versionLabel}.zip`;
        }
        const bundlePath = path.resolve(this.artifactTmpDir, `bundle-${versionLabel}.zip`);
        process.env.PATH = `/root/.local/bin:${process.env.PATH}`;
        const S3 = this.getS3Instance(this.serverless, this.options.region);
        this.logger.log('Uploading Application Bundle to S3...');
        this.logger.log(JSON.stringify(yield S3.upload({
            Body: fsp.createReadStream(bundlePath),
            Bucket: ebConfig.bucket,
            Key: fileName,
        }).promise()));
        this.logger.log('Application Bundle Uploaded to S3 Successfully');
        const EB = this.getElasticBeanstalkInstance(this.serverless, this.options.region);
        this.logger.log('Creating New Application Version...');
        this.logger.log(JSON.stringify(yield EB.createApplicationVersion({
            ApplicationName: applicationName,
            Process: true,
            SourceBundle: {
                S3Bucket: ebConfig.bucket,
                S3Key: fileName,
            },
            VersionLabel: versionLabel,
        }).promise()));
        this.logger.log('Waiting for application version...');
        let updated = false;
        while (!updated) {
            const response = yield EB.describeApplicationVersions({
                VersionLabels: [versionLabel],
            }).promise();
            this.logger.log(JSON.stringify(response));
            if (response.ApplicationVersions[0].Status === 'PROCESSED') {
                updated = true;
            }
            else if (response.ApplicationVersions[0].Status === 'FAILED') {
                throw new Error('Creating Application Version Failed');
            }
            else {
                yield BPromise.delay(5000);
            }
        }
        this.logger.log('New Application Version Created Successfully');
        this.logger.log('Updating Application Environment...');
        this.logger.log(JSON.stringify(yield EB.updateEnvironment({
            ApplicationName: applicationName,
            EnvironmentName: environmentName,
            VersionLabel: versionLabel,
        }).promise()));
        this.logger.log('Waiting for environment...');
        updated = false;
        while (!updated) {
            const response = yield EB.describeEnvironments({
                EnvironmentNames: [environmentName],
            }).promise();
            this.logger.log(JSON.stringify(response));
            if (response.Environments[0].Status === 'Ready') {
                updated = true;
            }
            else {
                yield BPromise.delay(5000);
            }
        }
        this.logger.log('Application Environment Updated Successfully');
        this.logger.log('Application Deployed Successfully');
    });
}
exports.default = deploy;
