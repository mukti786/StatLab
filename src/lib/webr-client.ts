import type { WebR as WebRInstance } from 'webr';

export type ROutput = { type: string; text: string };
export type RRunResult = { output: ROutput[]; images: ImageBitmap[]; durationMs: number };

async function formatCondition(value: unknown): Promise<string> {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toJs' in value && typeof value.toJs === 'function') {
    const serialized = await value.toJs() as { type?: string; names?: string[] | null; values?: unknown[] };
    if (serialized.names && serialized.values) {
      const messageIndex = serialized.names.indexOf('message');
      if (messageIndex >= 0) return formatCondition(serialized.values[messageIndex]);
    }
    if (serialized.type === 'character' && serialized.values) return serialized.values.join(' ');
    return JSON.stringify(serialized);
  }
  return String(value);
}

function rStringLiteral(value: string) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\r', '\\r').replaceAll('\n', '\\n').replaceAll('\t', '\\t')}"`;
}

function consoleProgram(source: string) {
  return `local({
    .statlab_expressions <- tryCatch(parse(text = ${rStringLiteral(source)}), error = function(e) {
      cat("STATLAB_ERROR:", conditionMessage(e), "\\n", sep = "")
      NULL
    })
    if (!is.null(.statlab_expressions)) for (.statlab_expression in .statlab_expressions) {
      .statlab_failed <- FALSE
      tryCatch(withCallingHandlers({
        .statlab_result <- withVisible(eval(.statlab_expression, envir = .GlobalEnv))
        if (.statlab_result$visible) print(.statlab_result$value)
      }, warning = function(w) {
        cat("STATLAB_WARNING:", conditionMessage(w), "\\n", sep = "")
        invokeRestart("muffleWarning")
      }, message = function(m) {
        cat("STATLAB_MESSAGE:", conditionMessage(m), "\\n", sep = "")
        invokeRestart("muffleMessage")
      }), error = function(e) {
        cat("STATLAB_ERROR:", conditionMessage(e), "\\n", sep = "")
        .statlab_failed <<- TRUE
      })
      if (.statlab_failed) break
    }
  })`;
}

let runtimePromise: Promise<WebRInstance> | undefined;

async function loadLibrary(runtime: WebRInstance) {
  const modules = [
    'variables_types.R', 'vectors_matrices.R', 'data_frames.R', 'control_flow_functions.R',
    'descriptive_statistics.R', 'probability_simulations.R', 'hypothesis_testing.R',
    'regression.R', 'data_visualization.R', 'datasets.R',
  ];
  for (const sourceFile of modules) {
    const response = await fetch(`/r/${sourceFile}`, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Could not load R source module ${sourceFile} (${response.status}).`);
    await runtime.evalRVoid(await response.text());
  }
}

export function initializeWebR(onStatus?: (status: 'initializing' | 'ready' | 'error') => void) {
  if (typeof window === 'undefined') return Promise.reject(new Error('WebR can only be initialized in a browser.'));
  if (!runtimePromise) {
    onStatus?.('initializing');
    runtimePromise = (async () => {
      const { WebR } = await import('webr');
      const runtime = new WebR();
      await runtime.init();
      await loadLibrary(runtime);
      onStatus?.('ready');
      return runtime;
    })().catch((error: unknown) => {
      runtimePromise = undefined;
      onStatus?.('error');
      throw error;
    });
  }
  return runtimePromise;
}

export async function executeR(code: string, runtime?: WebRInstance): Promise<RRunResult> {
  const activeRuntime = runtime ?? await initializeWebR();
  const shelter = await new activeRuntime.Shelter();
  const started = performance.now();
  try {
    const result = await shelter.captureR(consoleProgram(code), {
      withAutoprint: false, captureConditions: false, captureStreams: true,
      captureGraphics: { width: 900, height: 480 }, throwJsException: false,
    });
    return {
      output: await Promise.all(result.output.map(async ({ type, data }) => {
        const text = await formatCondition(data);
        const condition = text.match(/^STATLAB_(ERROR|WARNING|MESSAGE):([\s\S]*)$/);
        return condition
          ? { type: condition[1].toLowerCase(), text: condition[2].trim() }
          : { type, text };
      })),
      images: result.images,
      durationMs: performance.now() - started,
    };
  } finally {
    await shelter.purge();
  }
}

export async function executeRArray(code: string, runtime?: WebRInstance): Promise<unknown[]> {
  const activeRuntime = runtime ?? await initializeWebR();
  const result = await activeRuntime.evalR(code);
  try {
    if ('toArray' in result && typeof result.toArray === 'function') return await result.toArray();
    return [String(result)];
  } finally {
    await activeRuntime.destroy(result);
  }
}

export async function resetRSession(onStatus?: (status: 'initializing' | 'ready' | 'error') => void) {
  runtimePromise = undefined;
  return initializeWebR(onStatus);
}
