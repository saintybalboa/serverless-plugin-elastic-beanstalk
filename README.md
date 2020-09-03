# Elastic Beanstalk Deployment Plugin

A serverless plugin to deploy applications to AWS ElasticBeanstalk.

## Lifecycle events

1. **validate**: Checks this command has been executed inside a service directory.

2. **configure**: Generates configuration options required for AWS ElasticBeanstalk.

3. **build**: Bundles the application into a zip folder.

4. **deploy**: Uploads the application bundle to S3 and creates/updates application environment in AWS ElasticBeanstalk.


## Dependencies

* This plugin is dependent on the output of [Stack Config Plugin for Serverless](https://www.npmjs.com/package/serverless-plugin-stack-config)

## Features

* `elastic-beanstalk` - This uploads an ElasticBeanstalk application.

## Install

```shell
npm install --save serverless-plugin-elastic-beanstalk
```

## Usage

Add the plugin to your `serverless.yml` like the following:

### serverless.yml:

```yaml
provider:
...

plugins:
  - serverless-plugin-elastic-beanstalk

  # AWS Elastic Beanstalk config
  elastic-beanstalk:
    applicationName: custom-app-${opt:env}
    environmentName: custom-env-${opt:env}
    solutionStackName: '64bit Amazon Linux 2 v5.2.0 running Node.js 12'
    version: '2.0.4'
    key: ${opt:key}
    file:
      prefix: bundles
      name: api.zip
    platform: nodejs
    bucket: ${self:service}-${opt:env}
    # script: scripts/configure.js
    build:
      babel: false
      sourceMaps: true
      folder: /api
      include:
        - .ebextensions/**
        - src/**
        - package.json
        - index.html
        - cron.yaml

resources:
  Resources:
    S3BucketFrontEnd:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:custom.elastic-beanstalk.bucket}
        AccessControl: Private
```

List of AWS Beanstalk supported platforms: http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.platforms.html

**NOTE:** If providing a custom script, that script must be exported from the module using `module.exports`.

### shell command:

First time setup, create the AWS S3 bucket to store the application bundle:
```bash
serverless deploy --env dev --region eu-west-1 --key ec2-key
```

Deploy the application bundle to AWS Elastic Beanstalk:
```bash
serverless elastic-beanstalk --env dev --region eu-west-1 --key ec2-key
```

## License

MIT
