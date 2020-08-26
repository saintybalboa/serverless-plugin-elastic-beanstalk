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
        const version = getVersion_1.default(this.config.version);
        const versionLabel = `${this.config.applicationName}-${version}`;
        const solutionStackName = this.config.solutionStackName;
        let fileName = `bundle-${versionLabel}.zip`;
        if (this.config.file) {
            fileName = this.config.file.prefix ? `${this.config.file.prefix}/` : '';
            fileName += this.config.file.name ? `${this.config.file.name}` : `bundle-${versionLabel}.zip`;
        }
        const bundlePath = path.resolve(this.artifactTmpDir, `bundle-${versionLabel}.zip`);
        process.env.PATH = `/root/.local/bin:${process.env.PATH}`;
        const S3 = this.getS3Instance(this.serverless, this.options.region);
        this.logger.log('Uploading Application Bundle to S3...');
        this.logger.log(JSON.stringify(yield S3.upload({
            Body: fsp.createReadStream(bundlePath),
            Bucket: this.config.bucket,
            Key: fileName,
        }).promise()));
        this.logger.log('Application Bundle Uploaded to S3 Successfully');
        const EB = this.getElasticBeanstalkInstance(this.serverless, this.options.region);
        this.logger.log('Checking Application Environment...');
        const applicationVersions = yield EB.describeApplicationVersions({
            ApplicationName: this.config.applicationName
        }).promise();
        const hasApplication = applicationVersions && applicationVersions.ApplicationVersions.length > 0;
        if (!hasApplication) {
            this.logger.log('Creating New Application...');
            this.logger.log(JSON.stringify(yield EB.createApplication({
                ApplicationName: this.config.applicationName
            }).promise()));
        }
        this.logger.log('Creating New Application Version...');
        this.logger.log(JSON.stringify(yield EB.createApplicationVersion({
            ApplicationName: this.config.applicationName,
            Process: true,
            SourceBundle: {
                S3Bucket: this.config.bucket,
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
        if (!hasApplication) {
            this.logger.log('Creating Environment...');
            this.logger.log(JSON.stringify(yield EB.createEnvironment({
                ApplicationName: this.config.applicationName,
                EnvironmentName: this.config.environmentName,
                VersionLabel: versionLabel,
                SolutionStackName: solutionStackName,
                // marty todo: set these variables
                OptionSettings: [
                    {
                        Namespace: 'aws:autoscaling:launchconfiguration',
                        OptionName: 'IamInstanceProfile',
                        Value: 'aws-elasticbeanstalk-ec2-role'
                    },
                ]
            }).promise()));
        }
        else {
            this.logger.log('Updating Application Environment...');
            this.logger.log(JSON.stringify(yield EB.updateEnvironment({
                ApplicationName: this.config.applicationName,
                EnvironmentName: this.config.environmentName,
                VersionLabel: versionLabel,
            }).promise()));
        }
        this.logger.log('Waiting for environment...');
        updated = false;
        while (!updated) {
            const response = yield EB.describeEnvironments({
                EnvironmentNames: [this.config.environmentName],
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
