"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Get version from config.
 *
 * @param {String} version configuration object
 *
 * @returns {String} version string
 */
function getVersion(version) {
    if (version === 'latest') {
        return Math.floor(new Date().valueOf() / 1000).toString();
    }
    return version;
}
exports.default = getVersion;
