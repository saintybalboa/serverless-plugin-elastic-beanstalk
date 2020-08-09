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
/**
 * Validate configuration.
 *
 * @returns {undefined}
 */
function validate() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.serverless.config.servicePath) {
            throw new this.serverless.classes
                .Error('This command can only be run inside a service directory');
        }
        this.options.stage = this.options.stage
            || (this.serverless.service.provider && this.serverless.service.provider.stage)
            || 'dev';
        this.options.region = this.options.region
            || (this.serverless.service.provider && this.serverless.service.provider.region)
            || 'us-east-1';
    });
}
exports.default = validate;
