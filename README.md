# Elastic Beanstalk Deployment Plugin

[![Build Status](https://travis-ci.org/rawphp/serverless-plugin-elastic-beanstalk.svg?branch=master)](https://travis-ci.org/rawphp/serverless-plugin-elastic-beanstalk)

A serverless plugin to deploy applications to AWS ElasticBeanstalk.

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
```

List of AWS Beanstalk supported platforms: http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.platforms.html

**NOTE:** If providing a custom script, that script must be exported from the module using `module.exports`.

### shell command:

```shell
serverless elastic-beanstalk --stage dev --region eu-west-1 --key ec2-key
```

## License

MIT
