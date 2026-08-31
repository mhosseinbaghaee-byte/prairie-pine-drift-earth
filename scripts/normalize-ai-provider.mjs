import { readFile, writeFile } from "node:fs/promises";

const path = "src/lib/ai.ts";
let source = await readFile(path, "utf8");

source = source.replace(
  /const DEFAULT_ORDER: ProviderId\[\] = \[[^\n]+\];[^\n]*/,
  'const DEFAULT_ORDER: ProviderId[] = ["gemini"]; // production-safe: Gemini only',
);

source = source.replace(
  /function providerOrder\(\): ProviderId\[\] \{[\s\S]*?\n\}/,
  `function providerOrder(): ProviderId[] {
  // Production must not honor a stale AI_PROVIDER_ORDER environment variable.
  // This prevents accidental routing to xAI/OpenAI/Anthropic when their keys are present.
  return DEFAULT_ORDER;
}`,
);

await writeFile(path, source);
console.log("AI provider order normalized: Gemini only");
