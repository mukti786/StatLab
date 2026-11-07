# StatLab

**Explore data. Simulate ideas. Think statistically.**

StatLab is an interactive R programming and statistics learning lab for students who learn best by trying code and inspecting what it computes. It brings an R playground, focused lessons, small datasets, statistical summaries, simulations, charts, and beginner challenges into one browser workspace.

StatLab was developed as an independent student learning and engineering project connected to studying R through NPTEL SWAYAM as part of my college open elective. It is not an official course tool, and it does not reproduce course material.

> StatLab is an independent educational project created for learning and experimentation. It is not affiliated with, endorsed by, or an official product of NPTEL or SWAYAM.

## Features

- Client-side R execution through WebR, including printed results, warnings, messages, errors, and base R graphics where supported.
- R playground with starter examples, syntax-colored editor, Ctrl/Cmd+Enter, copy, reset, clear output, locally remembered code, and `.R` download.
- Interactive lessons for R fundamentals, vectors and matrices, and data frames.
- A guided, runnable 20-lesson path from first expressions through data manipulation and introductory statistics.
- R-backed descriptive statistics, seeded dice simulation, and histogram bin calculations.
- Dataset explorer with teaching datasets, search, and local CSV import/export (2 MB import limit).
- Nine R-checked challenges across beginner, intermediate, and advanced levels, with hints, solutions, and explanations.
- Versioned browser-local learning state for lesson and challenge completion, recent modules, activity, run count, theme, and editor code. Older unversioned progress migrates safely. No account is required.
- Responsive dark/light interface with a mobile navigation drawer.

The interface uses Recharts to display chart-ready counts and values computed in R. The charts themselves are rendered in the browser. CSV import is browser-local; imported tables can be inspected, exported, and converted into real R data frames for `str()` and `summary()` analysis.

## Screenshots

The files in `screenshots/` show the previous dashboard and should not be used as representative captures of the current interface. Fresh dashboard, playground, and learning-module screenshots still need to be captured before presenting the project publicly.

## Previously configured deployment URL

https://stat-lab-ruddy.vercel.app/

This URL was present in the repository before the audit; the deployment was not checked and may be out of date.

## Technology stack

- **Next.js App Router** serves the application shell and page.
- **React and TypeScript** implement typed interactive UI and client state.
- **Tailwind CSS 4** is configured alongside a small custom CSS design system.
- **WebR 0.6.0** runs the R interpreter compiled to WebAssembly in a browser worker. There is no R server in the execution path.
- **Recharts** renders charts from values calculated by R; **Lucide** supplies icons.
  - **Zod** validates CSV table structure; **Vitest** tests CSV handling and local progress storage.

The frontend handles navigation, editor input, local persistence, and presentation. WebR evaluates user code and the included R helpers in the browser. The UI formats the runtime's captured output and displays returned graphics; it does not fabricate substitute results.

## Architecture

```mermaid
flowchart LR
  User[Student] --> UI[Next.js and React UI]
  UI --> Client[WebR client adapter]
  Client --> Worker[WebR worker and WebAssembly R]
  RSrc[r/*.R source library] -->|loaded during startup| Worker
  Worker -->|captured output, conditions, graphics| Client
  Client --> UI
  UI --> Charts[Recharts browser charts]
  UI <--> Local[Browser localStorage]
```

At page startup, the client-only adapter dynamically imports WebR, initializes its worker, then fetches the published R source modules from `/r/` and evaluates them in the runtime. Playground runs use WebR's `Shelter.captureR()` with stream and graphics capture. A small R-side console wrapper parses and evaluates expressions sequentially, prints visible values, and turns R parse/runtime conditions into readable output. Calls that mutate the shared R session are queued so overlapping UI actions cannot evaluate concurrently. Statistical screens call the same R helper functions and map their returned values to UI output or chart series. Errors during initialization are shown in the runtime status; failed R expressions appear as errors and do not produce a success state. Each capture shelter is purged after the run.

WebR runs locally in the browser and does not send code or CSV contents to a StatLab backend. Browser-local storage is used for learning preferences/activity and the last playground code. Clearing site data removes this local information.

## Repository structure

```text
src/
  app/                 App Router page, layout, and styles
  components/           StatLab workspace and interactive modules
  lib/                  WebR adapter and CSV validation/serialization
r/
  variables_types.R
  vectors_matrices.R
  data_frames.R
  control_flow_functions.R
  descriptive_statistics.R
  probability_simulations.R
  hypothesis_testing.R
  regression.R
  data_visualization.R
  datasets.R
  examples/             runnable R examples
  tests/                native R validation script
scripts/
  copy-r-sources.mjs    publishes R source modules under public/r
  test-webr.mjs         direct Node WebR verification script
public/r/               generated copy served to the browser
tests/                  Vitest CSV tests
```

The authored `.R` files contain helper implementations used by lessons and the statistics, probability, dataset, and visualization workflows. `public/r/` is copied from `r/` before development and production builds; edit the authored source under `r/`.

Learning workspaces are switched inside one persistent browser application and mirrored in the URL hash, so links such as `/#r-playground` or `/#statistics-lab` open the matching section while keeping the same WebR session alive.

## Prerequisites and local development

- Node.js 20.9 or later (required by the selected Next.js release).
- npm (the repository includes `package-lock.json`).
- A modern browser with WebAssembly, Web Workers, and WebAssembly threads support as needed by WebR. Native R is not required for the in-browser runtime.
- Native R is only needed if you want to run `r/tests/test-statlab.R` outside WebR.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The first load downloads/initializes WebR and may take a short while; the status changes to **WebR ready** when the runtime and R helper files are loaded.

Other project commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm run build` first copies `r/*.R` to `public/r/`. The Node runtime script is available as `npm run test:runtime`; it currently fails on Windows Node 24 because WebR 0.6.0 passes a `file://` worker URL to Node's `Worker` constructor (`ERR_WORKER_PATH`). This Node-only limitation does not affect the browser runtime, which is verified manually in StatLab. The native R script may be run with `Rscript r/tests/test-statlab.R` if R is installed.

## Deploying to Vercel

1. Import the GitHub repository into Vercel and select the repository root as the project root.
2. Keep the detected **Next.js** framework preset and default `.next` output handling.
3. Use `npm install` for dependencies and `npm run build` for the build command. No environment variables or backend services are required.
4. Deploy, then verify the site on its deployed URL in a browser. In particular, confirm WebR initialization and that its worker and WebAssembly files load with the configured cross-origin isolation headers.

No production deployment was performed or checked during this audit.

## Running R code

1. Open **R Playground** from the left navigation.
2. Enter R code or choose one of the included examples.
3. Wait for the top-bar status to show **WebR ready**, then select **Run** or press Ctrl/Cmd+Enter.
4. Read captured R output, warnings, messages, or errors in the console panel. Use **Clear**, **Reset**, **Copy**, or **Download** for the editor workflow.
5. The last playground code is saved in this browser. Theme, recent activity, run count, and challenge progress are also local to this browser.

WebR is a real R runtime compiled to WebAssembly. It supports normal base R expressions, vectors, matrices, data frames, functions, control flow, and many statistical functions. Native system calls, arbitrary CRAN packages, and some operations requiring unavailable WebAssembly features are not supported. Keep long computations bounded: browser workers improve responsiveness, but memory and execution resources still belong to the user's device. Refreshing the page reinitializes WebR and resets the current R session.

## Tests and verification

- `npm test` runs the Vitest suite for CSV parsing, validation, R string escaping, round trips, and versioned progress storage/migration.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript strict checking.
- `npm run build` compiles the production Next.js app and prepares served R files.
- `npm run test:runtime` is configured for direct WebR checks in Node, but has the Windows worker URL limitation described above.
- `Rscript r/tests/test-statlab.R` is a native R test script and requires an installed R distribution.

The playground and lesson code have been exercised in a real browser using WebR: vector `mean()`/`sd()` returned 30 and 15.81139; the first lesson returned 5 and 4.666667; repeated runs retained the same R environment; and an undefined object displayed an R error. Descriptive statistics, correlation, a one-sample t-test, regression, dice simulation, histogram, boxplot, built-in datasets, and a quoted multiline CSV converted to an R data frame were also exercised. A challenge rejected an invalid answer and accepted a valid answer. The local learning trail restored runs, module visits, lesson and challenge progress after reload. Simulation results come from the actual seeded R runtime, not hardcoded UI values.


## Browser compatibility and limitations

WebR requires a modern browser that supports WebAssembly and Web Workers; startup downloads runtime assets and needs network access. Runtime startup time and memory use depend on device/browser. Only packages built and made available for WebAssembly can work; desktop R packages and system-dependent operations are not generally interchangeable. The current interface does not install packages, interrupt an active R computation, or persist the R session across reloads. Avoid unbounded loops. Charts use Recharts with R-produced values rather than a graphics device for those modules. Imported CSV files are parsed in-browser and can be sent to WebR as data frames; the bridge quotes values as R string literals and keeps CSV headers as data rather than executable names.

## Roadmap

- Add an explicit stop/reset control for active computations if supported by the runtime lifecycle.
- Add broader component and browser tests against WebR in a real browser.
- Capture and include real desktop/mobile screenshots.
- Deploy to Vercel and verify worker, WebAssembly, and isolation headers on the production domain.
- Expand the probability and visualization labs beyond their current core experiments and add more built-in teaching datasets.

## Contributing

1. Fork the repository and create a focused feature branch.
2. Make the change, add or update meaningful R or TypeScript tests, and keep the R helpers connected to the UI.
3. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` where applicable.
4. Open a pull request describing the change and its verification.

## License

No separate open-source license has been specified for this project. Unless and until a license is added, the project's original code remains subject to applicable copyright law. Public visibility on GitHub does not, by itself, grant general permission to reuse, modify, or redistribute the code.

Third-party dependencies and assets may have their own licenses.

## Acknowledgments and references

- [WebR documentation](https://docs.r-wasm.org/webr/latest/) — browser-based R runtime and API.
- [Next.js documentation](https://nextjs.org/docs)
- [React documentation](https://react.dev/)
- [Recharts documentation](https://recharts.org/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)

Third-party dependencies retain their own licenses; see their respective project documentation and package metadata.
