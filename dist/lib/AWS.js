"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElasticBeanstalkInstance = exports.getS3Instance = void 0;
/**
 * Get S3 instance.
 *
 * @param {IServerless} serverless serverless instance
 * @param {String}      region     region name
 *
 * @returns {IS3} S3 instance
 */
function getS3Instance(serverless, region) {
    const provider = serverless.getProvider(serverless.service.provider.name);
    return new provider.sdk.S3({ region, apiVersion: '2006-03-01' });
}
exports.getS3Instance = getS3Instance;
/**
 * Get ElasticBeanstalk instance.
 *
 * @param {IServerless} serverless serverless instance
 * @param {String}      region     region name
 *
 * @returns {IEB} elastic beanstalk instance
 */
function getElasticBeanstalkInstance(serverless, region) {
    const provider = serverless.getProvider(serverless.service.provider.name);
    return new provider.sdk.ElasticBeanstalk({ region, apiVersion: '2010-12-01' });
}
exports.getElasticBeanstalkInstance = getElasticBeanstalkInstance;
