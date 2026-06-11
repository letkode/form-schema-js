# Changelog

All notable changes to `@letkode/form-schema` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
