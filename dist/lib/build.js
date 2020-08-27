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
const bundle_bundler_1 = require("bundle-bundler");
const promise_fs_1 = require("promise-fs");
const getVersion_1 = require("./getVersion");
/**
 * Builds the application.
 *
 * @returns {undefined}
 */
function build() {
    return __awaiter(this, void 0, void 0, function* () {
        this.logger.log('Building Application Bundle...');
        this.config.version = getVersion_1.default(this.config.version);
        const applicationName = this.config.applicationName;
        const versionLabel = `${applicationName}-${this.config.version}`;
        const fileName = `bundle-${versionLabel}.zip`;
        this.logger.log(`Creating ${fileName}`);
        // make sure artifact directory exists
        yield promise_fs_1.default.access(this.artifactTmpDir);
        // get build configuration -- required
        const buildConfig = this.config.build;
        const bundler = new bundle_bundler_1.default({
            babel: buildConfig.babel || false,
            logger: this.logger,
            rootDir: process.cwd() + buildConfig.folder,
            sourceMaps: buildConfig.sourceMaps || false
        });
        yield bundler.bundle({
            include: this.config.build.include,
            output: `${this.artifactTmpDir}/${fileName}`
        });
    });
}
exports.default = build;
