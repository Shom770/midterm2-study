'use client';
// Compiles and runs Java in the browser with CheerpJ 5 (a JVM in WebAssembly,
// free for personal use). javac runs inside it. Source goes in /str/Main.java
// (written from JavaScript); classes go to a fresh /files/runN directory each
// time so a re-run never sees stale classes. CheerpJ prints System.out and
// System.err into the element with id "console", which we read after each step.

declare global {
  interface Window {
    cheerpjInit?: (opts: Record<string, unknown>) => Promise<void>;
    cheerpjRunMain?: (cls: string, classPath: string, ...args: string[]) => Promise<number>;
    cheerpOSAddStringFile?: (path: string, data: string) => void;
  }
}

export type JavaResult = {
  compiled: boolean;
  compileOutput: string;
  stdout: string;
  exitCode: number | null;
  timedOut: boolean;
};

const LOADER = 'https://cjrtnc.leaningtech.com/5.0/loader.js';
let ready: Promise<void> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let runId = 0;
let stuck = false;

function consoleEl(): HTMLElement {
  let el = document.getElementById('console');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'console';
    el.setAttribute('aria-hidden', 'true');
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  return el;
}

/** Load CheerpJ and start the JVM. The first call downloads the runtime. */
export function warmJava(): Promise<void> {
  if (!ready) {
    ready = new Promise<void>((resolve, reject) => {
      consoleEl();
      if (window.cheerpjInit) return resolve();
      const s = document.createElement('script');
      s.src = LOADER;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not download the Java runtime. Check your connection.'));
      document.head.appendChild(s);
    }).then(() => window.cheerpjInit!({ version: 21, status: 'none' }));
    ready.catch(() => (ready = null));
  }
  return ready;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return Promise.race([p, new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), ms))]);
}

/** Compile Main.java and run Main. Runs are queued; one JVM serves the whole page. */
export function runJava(source: string, timeoutMs = 20000): Promise<JavaResult> {
  const job = queue.then(async (): Promise<JavaResult> => {
    if (stuck) {
      return { compiled: false, compileOutput: 'A previous run is still going (an infinite loop?). Reload the page to restart Java.', stdout: '', exitCode: null, timedOut: true };
    }
    await warmJava();
    const out = consoleEl();
    const dir = `/files/run${++runId}`;
    window.cheerpOSAddStringFile!('/str/Main.java', source);
    out.textContent = '';
    const rc = await window.cheerpjRunMain!('com.sun.tools.javac.Main', '', '-nowarn', '-d', dir, '/str/Main.java');
    const compileOutput = out.textContent ?? '';
    if (rc !== 0) return { compiled: false, compileOutput, stdout: '', exitCode: rc, timedOut: false };
    out.textContent = '';
    const r = await withTimeout(window.cheerpjRunMain!('Main', dir), timeoutMs);
    if (r === 'timeout') {
      stuck = true;
      return { compiled: true, compileOutput, stdout: out.textContent ?? '', exitCode: null, timedOut: true };
    }
    return { compiled: true, compileOutput, stdout: out.textContent ?? '', exitCode: r, timedOut: false };
  });
  queue = job.catch(() => undefined);
  return job;
}
