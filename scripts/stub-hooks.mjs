/**
 * Node module hooks used by `scripts/verify-route.mts`.
 *
 * Two jobs:
 *  1. resolve `@/…` (the app's path alias) to real files,
 *  2. swap `@google/genai` for a stub the test can drive.
 */

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@google/genai") {
    return { url: "inkwell-stub:google-genai", shortCircuit: true, format: "module" };
  }
  if (specifier.startsWith("@/")) {
    const path = new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url);
    return nextResolve(path.href, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === "inkwell-stub:google-genai") {
    return {
      format: "module",
      shortCircuit: true,
      source: `
        export class GoogleGenAI {
          constructor(options) {
            globalThis.__genAiOptions = options;
          }
          get interactions() {
            return { create: (params) => globalThis.__fakeInteractionsCreate(params) };
          }
          get models() {
            return { countTokens: (params) => globalThis.__fakeCountTokens(params) };
          }
        }
      `,
    };
  }
  return nextLoad(url, context);
}
