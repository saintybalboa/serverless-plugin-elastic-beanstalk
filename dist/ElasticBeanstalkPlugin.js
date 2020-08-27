"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const AWS_1 = require("./lib/AWS");
const build_1 = require("./lib/build");
const configure_1 = require("./lib/configure");
const deploy_1 = require("./lib/deploy");
const validate_1 = require("./lib/validate");
class ElasticBeanstalkPlugin {
    /**
     * Create a new instance.
     *
     * @param {IServerless}              serverless the Serverless instance
     * @param {IElasticBeanstalkOptions} options    passed in options
     */
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.servicePath = this.serverless.config.servicePath;
        this.logger = this.serverless.cli;
        this.service = this.serverless.service;
        this.tmpDir = path.join(this.servicePath, '/.serverless');
        this.artifactTmpDir = path.join(this.tmpDir, './artifacts');
        if (this.service.custom) {
            this.config = this.service.custom['elastic-beanstalk'];
        }
        this.commands = this.defineCommands();
        this.hooks = this.defineHooks();
        this.getS3Instance = AWS_1.getS3Instance;
        this.getElasticBeanstalkInstance = AWS_1.getElasticBeanstalkInstance;
    }
    /**
     * Define plugin commands.
     *
     * @returns {IElasticBeanstalkCommands} the commands
     */
    defineCommands() {
        const commonOptions = {
            region: {
                shortcut: 'r',
                usage: 'Region of the service',
            },
            stage: {
                shortcut: 's',
                usage: 'Stage of the service',
            },
            verbose: {
                shortcut: 'v',
                usage: 'Show all stack events during deployment',
            },
        };
        return {
            'elastic-beanstalk': {
                lifecycleEvents: [
                    'validate',
                    'configure',
                    'deploy',
                ],
                options: commonOptions,
                usage: 'Deploys the application to AWS ElasticBeanstalk',
            },
        };
    }
    /**
     * Define plugin hooks.
     *
     * @returns {IElasticBeanstalkHooks} the hooks
     */
    defineHooks() {
        return {
            'elastic-beanstalk:deploy': () => __awaiter(this, void 0, void 0, function* () {
                yield validate_1.default.bind(this)();
                yield configure_1.default.bind(this)();
                yield build_1.default.bind(this)();
                yield deploy_1.default.bind(this)();
            })
        };
    }
}
exports.default = ElasticBeanstalkPlugin;
