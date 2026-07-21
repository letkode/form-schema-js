# Changelog

All notable changes to `@letkode/form-schema` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.0] - 2026-07-21

### Added

- **`RawOptionsSource.filter_by_search` / `ResolvedOptionsSource.filterBySearch`** — declares that a lazy (`pre_load: false`) options source should be re-fetched as the user types a search term (e.g. a searchable combobox over a large catalog), instead of the renderer fetching the full list once. Default: `false`.
- **`RawOptionsSource.search_param` / `ResolvedOptionsSource.searchParam`** — query param name used to send the search term when `filter_by_search` is `true`. Default: `'search'`.
- **`RawOptionsSource.method_init` / `ResolvedOptionsSource.initUrl`** — an optional secondary method (same `class`; `repository` sources reuse the `:method` URL slot, `api` sources reuse their fixed `endpoint`) used to "hydrate" already-selected values with their label — e.g. when editing a record whose current value wasn't part of whatever the renderer last fetched/searched. `initUrl` is `null` when `method_init` isn't set, signaling the renderer should skip hydration.
- **`RawOptionsSource.key_options_init` / `ResolvedOptionsSource.keyOptionsInit`** — query param name used to send the selected ids to `initUrl`, as an array. Default: `'id'`.

All four fields are additive and optional — existing `options_source` configs are unaffected.

## [1.5.0] - 2026-07-14

### Changed

- **BREAKING: `FieldOption.text` → `FieldOption.label`** (and `FieldOptionGroup.text` → `label`, `FieldOption.translations` entries `{ text, description }` → `{ label, description }`). The package previously mixed terminology: raw YAML input (`RawOptionValue.label`, `RawOptionsSource.label_key`) always spoke in terms of `label`, while the resolved output (`FieldOption.text`) spoke in terms of `text`. `label` is now used end-to-end, matching the `{ value, label }` convention already used by option consumers. Any renderer reading `option.text` must be updated to `option.label`.

### Added

- **`CustomFieldType`, `CustomSectionRender`, `CustomGroupRender`** — built-in, business-logic-free `'custom'` type/render definitions, now part of `ALL_FIELD_TYPES`/`ALL_SECTION_RENDERS`/`ALL_GROUP_RENDERS` and pre-registered on every `FormSchemaRegistry` instance. `type: 'custom'` (fields) and `render.type: 'custom'` (sections/groups) resolve out of the box — no `registerFieldType()`/`registerSectionRender()`/`registerGroupRender()` call needed. Intended as the escape hatch for project-specific one-off widgets: the consuming app dispatches on a project-defined `key` (`field.parameters.key` / `render.metadata.key`, meaningless to this package) instead of registering a dedicated class per widget.
- **`RawOptionsSource.description_key` / `ResolvedOptionsSource.description_key`** — new optional key (default: `'description'`) letting a `repository`/`api` options source declare which field in the raw API response holds the option description, mirroring `value_key`/`label_key`.

### Fixed

- **`normalizeApiResponse()`** — `translations[locale]` entries from a `repository`/`api` options source are now remapped through `label_key`/`description_key` the same way the top-level fields are. Previously only the top-level `value`/`label`/`description` were remapped; nested translations were cast through as-is, so an API returning e.g. `{ id, name, translations: { en: { name, description } } }` with `label_key: name` produced a resolved `option.translations.en.name` instead of `option.translations.en.label` — silently breaking translated option labels for any backend not already using the canonical `label`/`description` keys inside `translations`.

### Documentation

- **"`'custom'` — a built-in escape hatch instead of one type per widget"** — new subsection under "Extensibility" covering the above, contrasted with registering a dedicated `FieldTypeDefinition`/`RenderDefinition` per widget (the existing `ColorPickerFieldType` example) — use a dedicated class when a type has real defaults/metadata worth centralizing in the package, use `'custom'` + `key` when it doesn't.

---

## [1.4.1] - 2026-07-11

### Fixed

- **`normalizeApiResponse()`** — `translations` is now a recognized top-level key on API response items. Previously it wasn't in the known-keys list, so any `translations` field sent by a `repository`/`api` options source backend was swept into `option.data.translations` instead of `option.data`, and the resolved `option.translations` was always hardcoded to `{}` regardless of what the API sent. Now a `translations` object on the API item is assigned directly to `option.translations` (unset defaults to `{}` as before, so backends that don't send it see no change).

---

## [1.4.0] - 2026-07-11

### Added

- **`extends: <tag>`** — new optional top-level YAML field letting a form declare itself as a derived variant of another form (a *different, explicitly-named* tag), inheriting its shape and overriding only what differs. `resolve()` walks the chain (any depth) and deep-merges each file onto its base using the same `mergeRawForm` tag-matching merge already used for scope overlays (sections → groups → fields, `enabled: false` hides an inherited item, `style`/inline `options` replace wholesale). A circular chain (direct or transitive self-reference) throws instead of resolving.
- Scope overlays, when active via `withScope()`, are now applied **after** the `extends` chain resolves, keyed by the originally requested tag — so a derived form can carry its own optional scope overlay independently of its base's.

### Notes

- **Not a replacement for `withScope()`/scope overlays** — the two solve different axes and are meant to compose, not compete. `withScope` keeps the *same* tag and lets the resolver pick a variant at runtime based on active scope (transparent to the caller, missing overlay silently falls back to base). `extends` targets a *different*, explicitly-named tag that a caller must request on purpose, declared by the form's author at write time (a missing base tag is an error, not a fallback). See the "Form inheritance" section in the README for the full side-by-side comparison.
- Fully backward compatible: forms without `extends` resolve exactly as before, with no extra network requests.

---

## [1.3.0] - 2026-07-10

### Added

- **`RepositoryConfig.getHeaders()`** — new optional function returning extra headers to send on every `options_source: { type: repository }` request (e.g. `X-Tenant-Schema`, `X-Identity-Type`, or any other multi-tenant/identity header a backend requires). Called fresh on each request, merged into the request headers before `Authorization`.

### Fixed

- `RepositoryOptionsSource.resolve()` (the eager `pre_load: true` path) previously only sent `Content-Type` and `Authorization`, bypassing any app-level headers a backend might require beyond the JWT — causing 401s on multi-tenant backends that need a tenant/identity header on every request. `getHeaders()` closes that gap.

### Notes

- `buildLazyOutput()` (the deferred `pre_load: false` path) is untouched — no consumer resolves `ResolvedOptionsSource` client-side yet, so there was nothing to fix there.

---

## [1.2.0] - 2026-07-09

### Added

- **`withScope(scope)`** — new resolver chain method to opt into hub/tenant-style overlay resolution; scope is open-ended (`string`), mirrors `withContext()`
- **Scope overlay YAML files** — when `withScope(scope)` is set, `resolve()` additionally attempts to load `{baseUrl}/forms/{tag}.{scope}.yaml`; a 404 is treated as "no overlay for this scope" (not an error), so base-only forms keep working with zero overlay files present
- **`YamlLoader.loadOverlay(baseUrl, tag, scope)`** — non-throwing variant of `loadForm()` used for optional overlay files; returns `null` on 404, still throws on other HTTP errors
- **`mergeRawForm()`** (new `RawFormMerger` module) — pure, unit-testable function that deep-merges an overlay `RawFormFile` onto a base `RawFormFile`, matching sections, groups, fields, and collector `parameters.fields` by `tag`; matched items merge leaf-by-leaf (including one-level-deep merges of `attributes`, `parameters`, `options_source`, `translations`), unmatched overlay items are appended, and `enabled: false` on an overlay item hides the corresponding base item for that scope

### Notes

- Fully backward compatible: `resolve()` only attempts to load an overlay file when `withScope()` has been called on the chain; existing consumers see no behavior change and no new network requests
- `style` and inline `options` arrays are replaced wholesale by the overlay when present, never merged element by element
- `position` is a plain scalar leaf like any other field property, so an overlay can reorder fields for a given scope by only setting `position` on the fields that need to move
- Merge semantics documented in README — see "Scope overlays" section

---

## [1.1.0] - 2026-06-19

### Added

- **`description` field on `FieldOption`** — options now carry an optional description string (`string | null`), resolved from YAML or API responses
- **`translations` field on `FieldOption`** — each option exposes its full translations map (`Record<string, Partial<{ text: string; description: string }>>`) so renderers can switch locale without re-fetching
- **Option locale resolution** — inline options and `YamlCatalogSource` now apply `translations[locale]` at resolve time (both `label` → `text` and `description`); the active locale is picked from `withLocale()` on the resolver
- **`locale` on `ResolvedOptionsSource`** — lazy options sources (`repository`, `api`) now include the active locale in their descriptor so renderers can forward it to the backend (e.g. as `Accept-Language` or a query param)
- **`locale` on `ResolverExternalConfig`** — internal config struct now carries the active locale for options source implementations
- **`FormFieldMap` type** — `Record<string, FormField>` — a flat index of all fields in a form keyed by tag; collector sub-fields are included as top-level entries
- **`resolveFieldMap(formTag)`** — new public method on `FormSchemaResolver` that resolves a form and returns a `FormFieldMap` for quick tag-based field lookup
- **`description` in `normalizeApiResponse()`** — the utility now maps a `description` key from API rows into `FieldOption.description`; also initialises `translations: {}` on every returned option

---

## [1.0.0] - 2026-06-11

### Added

- **`FormSchemaResolver`** — immutable fluent builder that fetches, parses, and resolves YAML form definitions into a typed `FormSchema` JSON object
- **`FormSchemaRegistry`** — central container for all built-in and custom definitions; supports runtime extension
- **`createFormSchemaResolver()`** — convenience factory with all built-ins pre-registered; accepts optional `repository` and `connections` config
- **`YamlLoader`** — browser-native `fetch`-based YAML loader using `js-yaml`
- **22 built-in field types**: `string`, `email`, `phone`, `password`, `textarea`, `hidden`, `pin`, `number`, `range`, `date`, `datetime`, `date-range`, `select`, `select-multiple`, `combobox`, `radio`, `checkbox`, `switch`, `duallist`, `tree`, `rating`, `file`
- **Form renders**: `default`, `stepper`, `wizard`, `tabs`
- **Section renders**: `default`, `accordion`, `collapsible`, `tabs`
- **Group renders**: `default`, `fieldset`, `matrix`
- **7 interaction handlers**: `toggle_visibility`, `toggle_required`, `set_value`, `filter_options`, `set_date_constraint`, `compute`, `ajax_validate`
- **`YamlCatalogSource`** — resolves `options_source: { type: catalog, tag }` by fetching `options/{tag}.yaml`; always pre-loaded
- **`RepositoryOptionsSource`** — resolves `options_source: { type: repository }` against an internal backend; builds URL from a configurable `pathPattern` (`:class`/`:method` slot substitution, or query-param fallback); sends JWT via `Authorization: Bearer` header
- **`ApiOptionsSource`** — resolves `options_source: { type: api }` against named external API connections; secrets live in resolver config only, never in YAML
- **`normalizeApiResponse()`** utility — maps `value_key`/`label_key` fields from API responses to `{ value, text, data }` `FieldOption` objects; merges extra fields into `data`
- **`pre_load` flag** on `options_source` — `true` resolves options eagerly (inline); `false` embeds a `ResolvedOptionsSource` descriptor in the field JSON for the renderer to fetch lazily
- **`ResolvedOptionsSource`** interface — emitted in `field.options_source` for deferred options; contains `url`, `http_method`, `requires_auth`, `connection`, `params`, `value_key`, `label_key`
- **`RepositoryConfig`** and **`ConnectionConfig`** types — configure backend and external API connections in the resolver
- **Locale translation** — `withLocale(locale)` applies `translations[locale]` over `name`, `description`, and `placeholder` at all levels
- **Context-aware fields** — `withContext(context)` merges `attributes.actions[context]` overrides; context is open-ended (`string`)
- **Section filtering** — `includingSections(tags)` and `excludingSections(tags)`
- **FieldType defaults merging** — each field type declares default `parameters` and `attributes`; YAML values override them
- **`formatDefaultValue()`** per field type (`switch` → `boolean`, `checkbox/duallist/tree` → `[]`, `range` → `0`, etc.)
- **`UnknownFieldTypeError`** — thrown with a clear message listing all registered types
- Dual ESM + CJS build output via `tsup`
- Full TypeScript declarations (`.d.ts`)
- **`CollectorFieldType`** — new `collector` type for repeatable sub-field collections; `parameters.fields` accepts a full field list that is resolved recursively using the same pipeline (FieldType defaults, attributes, options, interactions, translations all applied); default parameters: `layout: 'horizontal'`, `add_label: 'Add item'`, `fields: []`
- Functional test suite (`test.mjs`) — 139 assertions covering all resolver features
- Documentation in English (`README.md`) and Spanish (`README.es.md`)
