'use client';
// Runs OCaml in the browser with the @live-codes/ocaml toplevel (copied to
// /ocaml/ by scripts/build-data.mjs). The worker answers one protocol: post
// {code, input, args, files}; it replies ['ready', banner] once, then
// ['result', exitCode, stdout, stderr, outcome, output, diagnostics] per run.
// exitCode is null when the code did not compile.
//
// Graded runs get a fresh worker each, so one attempt can't leave definitions
// behind for the next and an infinite loop is cut off by terminating it. A
// spare worker is kept warm. GUI previews use a persistent session instead,
// because each mouse event is a new phrase run against the same toplevel.

export type OcamlResult = {
  compiled: boolean;
  stdout: string;
  stderr: string;
  diagnostics: string;
  timedOut: boolean;
};

const WORKER_URL = '/ocaml/worker-entry.js';

function spawn(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_URL);
    const onMessage = (e: MessageEvent) => {
      if (Array.isArray(e.data) && e.data[0] === 'ready') {
        worker.removeEventListener('message', onMessage);
        resolve(worker);
      }
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', (e) => reject(new Error(`The OCaml runtime failed to load: ${e.message || 'unknown error'}`)));
  });
}

function exec(worker: Worker, code: string, timeoutMs: number): Promise<OcamlResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.removeEventListener('message', onMessage);
      resolve({ compiled: true, stdout: '', stderr: '', diagnostics: '', timedOut: true });
    }, timeoutMs);
    const onMessage = (e: MessageEvent) => {
      const m = e.data;
      if (!Array.isArray(m) || m[0] !== 'result') return;
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      const [, exitCode, stdout, stderr, , , diagnostics] = m as [string, number | null, string, string, unknown, unknown, string];
      resolve({ compiled: exitCode !== null, stdout: stdout ?? '', stderr: stderr ?? '', diagnostics: diagnostics ?? '', timedOut: false });
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ code, input: '', args: [], files: [] });
  });
}

let spare: Promise<Worker> | null = null;

/** Start loading the runtime ahead of the first run. */
export function warmOcaml() {
  if (!spare) {
    spare = spawn();
    spare.catch(() => (spare = null));
  }
  return spare;
}

/** Run a whole program in a fresh toplevel. */
export async function runOcaml(program: string, timeoutMs = 20000): Promise<OcamlResult> {
  const worker = await (spare ?? spawn());
  spare = null;
  warmOcaml();
  try {
    return await exec(worker, program, timeoutMs);
  } finally {
    worker.terminate();
  }
}

/** A toplevel that keeps its definitions between calls (for the live GUI preview). */
export class OcamlSession {
  private worker: Promise<Worker>;
  private queue: Promise<unknown> = Promise.resolve();
  private dead = false;

  constructor() {
    this.worker = spawn();
  }

  run(code: string, timeoutMs = 20000): Promise<OcamlResult> {
    const job = this.queue.then(async () => {
      if (this.dead) return { compiled: true, stdout: '', stderr: 'The preview stopped. Run the code again.', diagnostics: '', timedOut: true };
      const w = await this.worker;
      const r = await exec(w, code, timeoutMs);
      if (r.timedOut) this.dispose();
      return r;
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  dispose() {
    this.dead = true;
    this.worker.then((w) => w.terminate()).catch(() => undefined);
  }
}
