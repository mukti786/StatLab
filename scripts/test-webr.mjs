import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WebR } from 'webr';

const runtimeOptions = { baseUrl: new URL('../node_modules/webr/dist/', import.meta.url).href };
let runtime = new WebR(runtimeOptions);
await runtime.init();
try {
  for (const file of [
    'variables_types.R', 'vectors_matrices.R', 'data_frames.R', 'control_flow_functions.R',
    'descriptive_statistics.R', 'probability_simulations.R', 'hypothesis_testing.R',
    'regression.R', 'data_visualization.R', 'datasets.R',
  ]) await runtime.evalRVoid(await readFile(new URL(`../r/${file}`, import.meta.url), 'utf8'));

  assert.equal(await runtime.evalRNumber('x <- c(10, 20, 30, 40, 50); mean(x)'), 30);
  assert.ok(Math.abs(await runtime.evalRNumber('sd(x)') - Math.sqrt(250)) < 1e-10);
  assert.equal(await runtime.evalRNumber('df <- data.frame(name=c("A","B","C"), score=c(70,85,95)); mean(df$score)'), 250 / 3);
  const seededRate = await runtime.evalRNumber('set.seed(42); samples <- sample(c(0,1), 1000, replace=TRUE); mean(samples)');
  assert.ok(seededRate >= 0 && seededRate <= 1);
  assert.equal(await runtime.evalRNumber('length(statlab_simulate_dice(100, seed=3))'), 100);
  const shelter = await new runtime.Shelter();
  const capture = await shelter.captureR('x <- c(1,2,3); mean(x)', { withAutoprint: true, captureGraphics: false });
  assert.ok(capture.output.some(item => item.type === 'stdout' && String(item.data).includes('2')));
  const error = await shelter.captureR('stop("intentional check")', { throwJsException: false, captureGraphics: false });
  assert.ok(error.output.some(item => item.type === 'error'));
  await shelter.purge();
  assert.equal(await runtime.evalRNumber('user_value <- 41; user_value + 1'), 42);
  assert.equal(await runtime.evalRBoolean('base::exists("user_value", envir = base::globalenv())'), true);
  runtime.close();
  runtime = new WebR(runtimeOptions);
  await runtime.init();
  for (const file of [
    'variables_types.R', 'vectors_matrices.R', 'data_frames.R', 'control_flow_functions.R',
    'descriptive_statistics.R', 'probability_simulations.R', 'hypothesis_testing.R',
    'regression.R', 'data_visualization.R', 'datasets.R',
  ]) await runtime.evalRVoid(await readFile(new URL(`../r/${file}`, import.meta.url), 'utf8'));
  assert.equal(await runtime.evalRBoolean('base::exists("user_value", envir = base::globalenv())'), false);
  assert.equal(await runtime.evalRNumber('mean(c(10, 20, 30, 40, 50))'), 30);
  console.log('WebR checks passed: helper modules, calculations, data frames, sampling, output/errors, session persistence and clean-session reset.');
} finally {
  runtime.close();
}
