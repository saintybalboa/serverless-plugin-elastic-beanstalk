import { ElasticBeanstalk, S3 as IS3 } from "aws-sdk";
import * as BPromise from 'bluebird';
import * as fsp from 'fs-promise';
import * as path from 'path';
import getVersion from './getVersion';

/**
 * Retrieves stack Ouputs from AWS.
 *
 * @returns {undefined}
 */
export default async function deploy() {
  this.logger.log('Deploying Application to ElasticBeanstalk...');

  const version = getVersion(this.config.version);
  const versionLabel = `${this.config.applicationName}-${version}`;
  const solutionStackName = this.config.solutionStackName;

  let fileName = `bundle-${versionLabel}.zip`;

  if (this.config.file) {
    fileName = this.config.file.prefix ? `${this.config.file.prefix}/` : '';
    fileName += this.config.file.name ? `${this.config.file.name}` : `bundle-${versionLabel}.zip`;
  }

  const bundlePath = path.resolve(this.artifactTmpDir, `bundle-${versionLabel}.zip`);

  process.env.PATH = `/root/.local/bin:${process.env.PATH}`;

  const S3: IS3 = this.getS3Instance(this.serverless, this.options.region);

  this.logger.log('Uploading Application Bundle to S3...');

  this.logger.log(
    JSON.stringify(
      await S3.upload({
        Body: fsp.createReadStream(bundlePath),
        Bucket: this.config.bucket,
        Key: fileName,
      }).promise(),
    ),
  );

  this.logger.log('Application Bundle Uploaded to S3 Successfully');

  const EB: ElasticBeanstalk = this.getElasticBeanstalkInstance(this.serverless, this.options.region);

  this.logger.log('Checking Application Environment...');

  const applicationVersions = await EB.describeApplicationVersions({
    ApplicationName: this.config.applicationName
  }).promise();

  const hasApplication: Boolean = applicationVersions && applicationVersions.ApplicationVersions.length > 0;

  if (!hasApplication) {
    this.logger.log('Creating New Application...');

    this.logger.log(
      JSON.stringify(
        await EB.createApplication({
          ApplicationName: this.config.applicationName
        }).promise(),
      ),
    );
  }

  this.logger.log('Creating New Application Version...');

  this.logger.log(
    JSON.stringify(
      await EB.createApplicationVersion({
        ApplicationName: this.config.applicationName,
        Process: true,
        SourceBundle: {
          S3Bucket: this.config.bucket,
          S3Key: fileName,
        },
        VersionLabel: versionLabel,
      }).promise(),
    ),
  );

  this.logger.log('Waiting for application version...');

  let updated = false;

  while (!updated) {
    const response = await EB.describeApplicationVersions({
      VersionLabels: [versionLabel],
    }).promise();

    this.logger.log(JSON.stringify(response));

    if (response.ApplicationVersions[0].Status === 'PROCESSED') {
      updated = true;
    } else if (response.ApplicationVersions[0].Status === 'FAILED') {
      throw new Error('Creating Application Version Failed');
    } else {
      await BPromise.delay(5000);
    }
  }

  this.logger.log('New Application Version Created Successfully');

  if (!hasApplication) {
    this.logger.log('Creating Environment...');

    this.logger.log(
      JSON.stringify(
        await EB.createEnvironment({
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
            /* more items */
        ]
        }).promise(),
      ),
    );
  } else {
    this.logger.log('Updating Application Environment...');

    this.logger.log(
      JSON.stringify(
        await EB.updateEnvironment({
          ApplicationName: this.config.applicationName,
          EnvironmentName: this.config.environmentName,
          VersionLabel: versionLabel,
        }).promise(),
      ),
    );
  }

  this.logger.log('Waiting for environment...');

  updated = false;

  while (!updated) {
    const response = await EB.describeEnvironments({
      EnvironmentNames: [this.config.environmentName],
    }).promise();

    this.logger.log(JSON.stringify(response));

    if (response.Environments[0].Status === 'Ready') {
      updated = true;
    } else {
      await BPromise.delay(5000);
    }
  }

  this.logger.log('Application Environment Updated Successfully');
  this.logger.log('Application Deployed Successfully');
}
