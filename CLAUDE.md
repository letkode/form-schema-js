# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # compile src/ → dist/ (ESM + CJS + .d.ts)
pnpm dev            # watch mode
pnpm typecheck      # tsc --noEmit
pnpm test           # build then run test.mjs against dist/
```

There is no test framework — `test.mjs` is a hand-rolled functional test that mocks `globalThis.fetch` and asserts against the compiled output in `dist/`. Always run `pnpm build` before running tests manually. The test file reads YAML fixtures from `../../../lka-react-ui-base/public/resources/form-schema` relative to this package, so that sibling package must be present for the full test suite to pass.

## Architecture

This is a **YAML-driven form schema resolver** — a pure library (no UI). It reads YAML files via `fetch`, resolves them into a typed `FormSchema` JSON object, and delegates all rendering and field-type logic to a plugin registry.

### Layered structure

```
src/
  domain/types.ts               — all TypeScript types (Raw* input shapes, resolved output shapes)
  application/
    loader/YamlLoader.ts        — fetch + js-yaml parse for form YAML files
    registry/FormSchemaRegistry.ts — plugin registry (field types, renders, interactions, options sources)
    resolver/FormSchemaResolver.ts — main resolution pipeline
  infrastructure/
    field-types/                — one class per FieldType, extend AbstractFieldType
    renders/form|section|group/ — one class per render variant, extend AbstractRender
    interactions/index.ts       — simple name-bag of known interaction action strings
    options/                    — YamlCatalogSource, RepositoryOptionsSource, ApiOptionsSource
  utils/normalizeApiResponse.ts — maps flat API response rows into FieldOption shape
  index.ts                      — public API + createFormSchemaResolver() factory
```

### Resolution pipeline (FormSchemaResolver)

`resolver.resolve(formTag)` fetches `{baseUrl}/forms/{tag}.yaml`, then recursively walks: form → sections → groups → fields. The resolver is **immutable** — `withLocale()`, `withContext()`, `includingSections()`, `excludingSections()` each return a new instance.

Key behaviours:
- **Field type defaults**: `FormSchemaRegistry.getFieldType(type)` looks up the registered `FieldTypeDefinition`; its `getDefaultParameters()` and `getDefaultAttributes()` are merged with YAML values (YAML wins).
- **Context overrides**: `field.attributes.actions[context]` can override `required`/`readonly`/`enabled` at resolve time.
- **Options resolution**: Three paths — inline `options` array, `options_source` with `pre_load: true` (fetch at resolve time), or `options_source` with `pre_load: false` (emit a `ResolvedOptionsSource` descriptor for the renderer to fetch lazily).
- **`collector` field type**: Its `parameters.fields` is an array of `RawField` objects that are recursively resolved into full `FormField` objects during field resolution.
- **Translations**: `withLocale(locale)` causes the resolver to prefer `translations[locale].*` over the default field/section/group names.

### Plugin interfaces

To extend the library, implement one of these interfaces and register with `FormSchemaRegistry`:

| Interface | Base class | Register method |
|---|---|---|
| `FieldTypeDefinition` | `AbstractFieldType` | `registerFieldType()` |
| `RenderDefinition` | `AbstractRender` | `registerFormRender()` / `registerSectionRender()` / `registerGroupRender()` |
| `InteractionHandlerDefinition` | — | `registerInteractionHandler()` |
| `OptionsSourceDefinition` | — | `registerOptionsSource()` |

`OptionsSourceDefinition` has an optional `buildLazyOutput()` method — implement it to support deferred loading; if absent, the source always pre-loads.

### Options sources

- **`catalog`** (`YamlCatalogSource`): always pre-loaded; fetches `{baseUrl}/options/{tag}.yaml`.
- **`repository`** (`RepositoryOptionsSource`): calls an internal authenticated backend. URL built from `RepositoryConfig.pathPattern` with `:class`/`:method` placeholders; missing placeholders become query params. Sends `Authorization: Bearer {getToken()}`.
- **`api`** (`ApiOptionsSource`): calls an external connection defined in `connections` config. Resolves `{connection.baseUrl}{endpoint}`.

### Build

`tsup` produces `dist/index.js` (ESM), `dist/index.cjs` (CJS), and `dist/index.d.ts`. All source imports use `.js` extensions (required for ESM Node resolution even though source files are `.ts`).
