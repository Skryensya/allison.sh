# Avatar speech bubble regression notes (2026-04-10)

## What worked before

Known-good baseline: commit `9008982`.

- `src/scripts/avatar-client.ts` was bundled by `scripts/build-client-modules.mjs` (esbuild).
- Avatar click created/used `SpeechBubble` and called `speechBubble.next(root, root)`.
- Mouth animation was driven by `avatar:set-mouth` events emitted by `SpeechBubble`.
- Bubble typing animation + hide timing were stable.

## What broke

After voice-category work, `avatar-client.ts` used:

```ts
import.meta.glob('../assets/voices/*.mp3', { eager: true, import: 'default' })
```

This is a Vite-only API.

However, this project bundles client modules with **esbuild** via:

- `scripts/build-client-modules.mjs`

esbuild does not transform `import.meta.glob`. It left it in the output JS, causing runtime failure in the avatar client module.

## Symptoms observed

- Avatar click did not show speech bubble.
- Avatar interactive behavior appeared broken.
- In built output, raw `import.meta.glob(...)` was present.
- On some runs, first click was ignored if the module had not finished loading yet.
- Bubble could appear but no audio playback, with dev logs showing 404s for voice files like `/assets/09_mid-*.mp3`.

## Diagnosis proof

Command used:

```bash
rg -n "import\.meta\.glob" public/client/avatar-client-*.js
```

When broken, this returned a match in the built avatar client chunk.

## Fix applied

1. Replaced `import.meta.glob` with explicit static mp3 imports in `src/scripts/avatar-client.ts`.
2. Kept phrase-to-category mapping (`short`, `mid`, `long`).
3. Kept bubble behavior intact; added only optional `onTypingStart` / `onTypingEnd` hooks in `src/scripts/speech-bubble.ts`.
4. Started voice on `onTypingStart` and stopped on `onTypingEnd + 220ms`.
5. Added a lightweight warmup in `src/components/Avatar.astro` so avatar module loads on idle.
6. Simplified `observeAvatar()` in `src/scripts/avatar-client.ts` to initialize immediately once module is loaded (prevents missing the first click when avatar enters viewport and observer callback hasn’t fired yet).
7. Added preload triggers in `src/components/Avatar.astro` (`pointerenter`, `pointerdown`, `focus`) to warm up the avatar module before click.
8. Fixed voice URL resolution in `src/scripts/avatar-client.ts` by converting imported asset paths to absolute URLs with `new URL(url, import.meta.url).href`.
   - This prevents `/assets/*.mp3` 404s and correctly resolves to `/client/assets/*.mp3`.
9. Removed async boundary from click-to-speech path in `src/scripts/avatar-client.ts`:
   - Cache `SpeechBubble` ctor at module load.
   - In click handler, create/show bubble synchronously when ctor is ready.
   - This keeps `audio.play()` inside the same user gesture task and avoids autoplay blocking.
10. Verified no `import.meta.glob` remained in built output.

## Validation checklist

- `npm run build` passes.
- `rg -n "import\.meta\.glob" public/client/avatar-client-*.js` returns no matches.
- Avatar bubble appears on click and text typing animates.
- Voice starts with typing and is cut shortly after typing end.

## Guardrail

For scripts bundled through `build-client-modules.mjs` (esbuild), avoid Vite-only APIs (`import.meta.glob`) unless bundling strategy changes.
