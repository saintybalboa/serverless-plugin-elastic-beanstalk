import Bundler from 'bundle-bundler';
import fsp from 'promise-fs';
import { IBuildConfig } from "../types";
import getVersion from './getVersion';

/**
 * Builds the application.
 *
 * @returns {undefined}
 */
export default async function build(): Promise<void> {
  this.logger.log('Building Application Bundle...');

  this.config.version = getVersion(this.config.version);

  const applicationName: string = this.config.applicationName;
  const versionLabel: string = `${applicationName}-${this.config.version}`;
  const fileName: string = `bundle-${versionLabel}.zip`;

  this.logger.log(`Creating ${fileName}`);

  // make sure artifact directory exists
  await fsp.access(this.artifactTmpDir);

  // get build configuration -- required
  const buildConfig: IBuildConfig = this.config.build;

  const bundler = new Bundler({
    babel: buildConfig.babel || false,
    logger: this.logger,
    rootDir: process.cwd() + buildConfig.folder,
    sourceMaps: buildConfig.sourceMaps || false
  });

  await bundler.bundle({
    include: this.config.build.include,
    output: `${this.artifactTmpDir}/${fileName}`
  });
}
