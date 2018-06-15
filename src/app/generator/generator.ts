import * as nunjucks from 'nunjucks';
import { GeneratorService } from './generator.service';
import { filterIndex } from '../../filters';
import { Artifact } from './artifact';
import { Observable } from 'rxjs/Observable';
import { CodeFormatter } from '../code-formatter/code-formatter';
import { TemplateFilter } from '../template-filter';
import { LangUtils } from '@codebalancers/commons';
import { existsSync, lstatSync } from 'fs';
import { ModelProcessor } from '../../model-processor/model-processor';
import { Logger } from '@codebalancers/logging';

export function startGeneration(filePath: string, configFiles: string[], filterIndexPath: string, processorIndexPath: string): void {
  const logger = new Logger('startGeneration');

  const codeFormatter = new CodeFormatter();

  logger.info('startGeneration for', filePath, configFiles);

  const env = nunjucks.configure({
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true
  });

  // register configured filters
  if (LangUtils.isDefined(filterIndexPath)
    && existsSync(filterIndexPath)
    && lstatSync(filePath).isFile()) {
    (require(filterIndexPath).filterIndex as TemplateFilter[]).forEach(filter => filter.registerFilter(env));
  }

  // register build in filters
  filterIndex.forEach(filter => filter.registerFilter(env));

  // register configured filters
  let processorIndex: ModelProcessor[];
  if (existsSync(processorIndexPath) && lstatSync(processorIndexPath).isFile()) {
    processorIndex = require(processorIndexPath).processorIndex;
  } else {
    logger.error('processorIndexPath not found', processorIndexPath);
    return;
  }

  const artifactsObservables: Observable<Artifact>[] = [];

  // -- process all config files
  configFiles.forEach(cf => {
    logger.info('handle ', cf);
    const a = new GeneratorService(processorIndex).generate(filePath, cf);
    artifactsObservables.push(...a);
  });

  Observable
    .forkJoin(artifactsObservables)
    .subscribe((artifacts: Artifact[]) => {
      // remove already formatted artifacts
      const files = artifacts.filter(artifact => artifact.formatted === false);

      // call code formatter
      codeFormatter.formatCode(files);
    });
}
