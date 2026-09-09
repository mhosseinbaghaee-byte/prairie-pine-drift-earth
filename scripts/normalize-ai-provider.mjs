// NOTE: This script previously force-rewrote DEFAULT_ORDER in src/lib/ai.ts
// on every build to Gemini-only, which silently ignored the configured OpenAI/Liara
// key even after it was purchased. It is now a no-op so the provider order
// committed in src/lib/ai.ts is respected as-is. Kept as a file (rather than
// removed) so the build script in package.json does not need to change.
console.log("AI provider order normalization: skipped (no-op) - using src/lib/ai.ts as committed.");
