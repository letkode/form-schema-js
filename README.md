# @letkode/form-schema

A framework-agnostic JavaScript package that reads YAML form definitions and resolves them into a fully-structured **FormSchema JSON** — ready to be consumed by any form renderer.

Inspired by the PHP [`letkode/form-schema-bundle`](https://github.com/letkode/form-schema-bundle), this package ports the same schema resolution pipeline to the browser.

---

## Table of Contents

- [How it works](#how-it-works)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [YAML reference](#yaml-reference)
  - [Form file](#form-file)
  - [Options file](#options-file)
- [Field types](#field-types)
- [Render types](#render-types)
- [Interactions](#interactions)
- [Context-aware fields](#context-aware-fields)
- [Scope overlays](#scope-overlays)
- [Form inheritance (`extends`)](#form-inheritance-extends)
- [Extensibility](#extensibility)
- [React / TanStack Query integration](#react--tanstack-query-integration)
- [API reference](#api-reference)
- [Output JSON shape](#output-json-shape)

---

## How it works

```
public/resources/form-schema/
  forms/user_profile.yaml        ← you write this
  options/countries.yaml         ← you write this
         │
         ▼
  FormSchemaResolver             ← this package
  (enriches with FieldType
   defaults, resolves options,
   merges render metadata)
         │
         ▼
  FormSchema JSON                ← your renderer consumes this
```

The resolver:
1. Fetches the YAML via `fetch()` (browser-native, no Node.js `fs` required)
2. Merges per-field defaults from each `FieldType` definition (parameters, attributes)
3. Resolves `options_source` references by fetching the referenced options YAML
4. Merges render metadata defaults for each form / section / group render type
5. Applies locale translations and context overrides
6. Sorts sections, groups, and fields by `position`
7. Returns a typed `FormSchema` object

---

## Installation

```bash
npm install @letkode/form-schema
# or
pnpm add @letkode/form-schema
# or
yarn add @letkode/form-schema
```

---

## Quick start

```ts
import { createFormSchemaResolver } from '@letkode/form-schema'

const resolver = createFormSchemaResolver({
  baseUrl: '/resources/form-schema',  // where your YAML files are served from
})

const schema = await resolver
  .withLocale('en')
  .withContext('create')
  .resolve('user_profile')   // loads /resources/form-schema/forms/user_profile.yaml

console.log(JSON.stringify(schema, null, 2))
```

---

## Project layout

Place your YAML files inside your project's `public/` directory so they are served statically:

```
your-project/
└── public/
    └── resources/
        └── form-schema/
            ├── forms/
            │   ├── user_profile.yaml
            │   ├── login.yaml
            │   └── onboarding.yaml
            └── options/
                ├── countries.yaml
                ├── states.yaml
                └── roles.yaml
```

---

## YAML reference

### Form file

**Minimum required fields**: `tag`, `name`, at least one section with one group with one field.

```yaml
# public/resources/form-schema/forms/user_profile.yaml

tag: user_profile             # unique identifier, also used as the form id
name: User Profile            # display name
enabled: true                 # false = skip entirely
default_locale: en            # fallback locale for translations
parameters: {}                # arbitrary key/value passed through to the JSON
extends: base_form_tag        # optional — inherits from another form's tag, see "Form inheritance" below

render:
  type: stepper               # form-level render: default | stepper | wizard | tabs
  metadata:
    orientation: horizontal   # stepper/wizard: horizontal | vertical
    show_progress: true
    allow_skip: false
    persist_on_navigate: true

translations:
  es:
    name: Perfil de Usuario

sections:
  - tag: personal_data
    name: Personal Data
    position: 1
    enabled: true
    description: null          # optional subtitle
    parameters: {}

    render:
      type: accordion          # section render: default | accordion | collapsible | tabs
      metadata:
        allow_multiple_open: false
        first_open: true

    translations:
      es:
        name: Datos Personales

    groups:
      - tag: basic_info
        name: Basic Information
        position: 1
        enabled: true

        render:
          type: fieldset       # group render: default | fieldset | matrix
          metadata:
            legend: true
            legend_custom: null

        fields:
          - tag: first_name
            name: First Name
            type: string       # see Field types below
            position: 1
            enabled: true
            placeholder: Enter your first name
            default_value: null
            style: [w-1/2]     # Tailwind width classes applied to the field wrapper

            attributes:
              required: true
              readonly: false
              unique:
                enabled: false
                entity: null
                method: null
              filter:
                enabled: false
                key: null
              actions:         # context overrides — open-ended, any key works
                create:
                  required: true
                edit:
                  required: true
                show:
                  readonly: true
                my_custom_context:
                  enabled: false

            parameters:        # merged on top of the FieldType defaults
              label_style: default
              max_length: 100

            interactions:
              - trigger: change
                action: toggle_visibility
                target: bio
                condition:
                  operator: falsy
                params: {}

            translations:
              es:
                name: Nombre
                placeholder: Ingresa tu nombre

          - tag: country
            name: Country
            type: select
            position: 2
            style: [w-1/2]

            # Inline options (takes priority over options_source)
            options:
              - value: us
                label: United States
                position: 1
                data: {}
              - value: es
                label: España
                position: 2
                data: {}

          - tag: role
            name: Role
            type: radio
            position: 3
            style: [w-full]

            # Reference to an options catalog file
            options_source:
              type: catalog    # built-in type; extensible via registerOptionsSource()
              tag: roles       # loads /resources/form-schema/options/roles.yaml
```

---

### Options file

```yaml
# public/resources/form-schema/options/countries.yaml

tag: countries
name: Countries
values:
  - value: us
    label: United States
    position: 1
    tag: null          # optional machine-readable tag for this option
    icon: null         # optional icon identifier
    color: null        # optional color (hex / css color)
    data:              # arbitrary data used for client-side filtering
      country_code: US
      region: north_america
  - value: es
    label: España
    position: 2
    data:
      country_code: ES
      region: europe
```

---

## Field types

| Type | `takesOptions` | Notable default parameters |
|---|---|---|
| `string` | No | `max_length: 255`, `min_length: null` |
| `email` | No | `max_length: 254` |
| `phone` | No | `max_length: 20` |
| `password` | No | `min_length: 8`, `max_length: null` |
| `textarea` | No | `rows: 4`, `max_length: null` |
| `hidden` | No | `label_style: 'hidden'` |
| `pin` | No | `length: 4` |
| `number` | No | `min: null`, `max: null`, `step: 1` |
| `range` | No | `min: 0`, `max: 100`, `step: 1` |
| `date` | No | — |
| `datetime` | No | — |
| `date-range` | No | default_value → `{ from: null, to: null }` |
| `select` | **Yes** | — |
| `select-multiple` | **Yes** | default_value → `[]` |
| `combobox` | **Yes** | `searchable: true`, `api_url: null` |
| `radio` | **Yes** | `layout: 'vertical'` |
| `checkbox` | **Yes** | `layout: 'vertical'`, default_value → `[]` |
| `switch` | No | default_value → `false` |
| `duallist` | **Yes** | `max_count_items: null`, default_value → `[]` |
| `tree` | **Yes** | default_value → `[]` |
| `rating` | No | `max: 5` |
| `file` | No | `accept: null`, `multiple: false` |
| `collector` | No | `layout: 'horizontal'`, `add_label: 'Add item'`, `min_items: null`, `max_items: null`, `fields: []` |

All types share `label_style: 'default'` as a base parameter.

### The `collector` field type

`collector` renders a repeatable group of sub-fields (e.g. "add another phone number"). Its `parameters.fields` is an array of `RawField` objects — the same shape as any group's `fields` entry — which the resolver recursively resolves into full `FormField` objects at resolve time:

```yaml
- tag: phones
  name: Phone Numbers
  type: collector
  position: 4
  parameters:
    add_label: Add phone number
    min_items: 1
    max_items: 5
    fields:
      - tag: number
        name: Number
        type: phone
        position: 1
      - tag: label
        name: Label
        type: select
        position: 2
        options:
          - value: mobile
            label: Mobile
          - value: home
            label: Home
```

---

## Render types

### Form renders (`render.type` at form level)

| Type | Default metadata |
|---|---|
| `default` | — |
| `stepper` | `orientation: 'horizontal'`, `show_progress: true`, `allow_skip: false`, `persist_on_navigate: true` |
| `wizard` | `orientation: 'horizontal'`, `show_progress: true`, `allow_skip: false`, `persist_on_navigate: false` |
| `tabs` | `orientation: 'horizontal'`, `lazy_load: false` |

### Section renders (`render.type` at section level)

| Type | Default metadata |
|---|---|
| `default` | — |
| `accordion` | `allow_multiple_open: false`, `first_open: true` |
| `collapsible` | `default_collapsed: false` |
| `tabs` | `orientation: 'horizontal'`, `lazy_load: false` |

### Group renders (`render.type` at group level)

| Type | Default metadata |
|---|---|
| `default` | — |
| `fieldset` | `legend: false`, `legend_custom: null` |
| `matrix` | `rows: []`, `cols: []` |

---

## Interactions

Interactions define dynamic behaviors that the renderer evaluates client-side. The resolver validates that each `action` is registered and passes the interaction through to the output JSON as-is.

```yaml
interactions:
  - trigger: change         # change | blur | focus
    action: toggle_visibility
    target: bio             # field tag — or null to apply to self, or an array of tags
    condition:
      operator: falsy       # truthy | falsy — omit for "always execute"
    params: {}
```

### Available actions

| Action | `params` |
|---|---|
| `toggle_visibility` | — |
| `toggle_required` | — |
| `set_value` | `{ value: <any> }` |
| `filter_options` | `{ mode: 'client' \| 'server', filter_key?: string, filter_param?: string }` |
| `set_date_constraint` | `{ constraint: 'min' \| 'max' }` |
| `compute` | `{ expression: string, sources: string[], decimals: number \| null }` |
| `ajax_validate` | `{ endpoint: string, method: string }` |

**`filter_options` — client mode**: filters another field's options using `option.data[filter_key]` matched against this field's current value.

**`compute`**: evaluates an arithmetic expression with `{field_tag}` placeholders. Example:
```yaml
action: compute
target: total
params:
  expression: "{base_salary} + {bonus}"
  sources: [base_salary, bonus]
  decimals: 2
```

---

## Context-aware fields

The same form can behave differently depending on the `context` passed to the resolver. Contexts are completely open-ended — define whatever keys make sense for your application.

```yaml
attributes:
  required: true
  actions:
    create:
      required: true
    edit:
      required: false    # password optional on edit
    show:
      readonly: true
    wizard_step_2:       # any custom context you define
      enabled: false
```

```ts
// Create context
resolver.withContext('create').resolve('user_profile')

// Edit context — password becomes optional
resolver.withContext('edit').resolve('user_profile')

// Any custom context
resolver.withContext('wizard_step_2').resolve('user_profile')
```

When a context is active, `attributes.actions[context]` overrides are merged into the field's `required` and `readonly` values before the schema is returned.

---

## Scope overlays

`withContext()` is for varying attributes like `required`/`readonly` within the same file. When a form needs a genuinely different shape depending on a platform-level scope — e.g. a hub vs. tenant deployment, or any other multi-environment split — use `withScope(scope)` instead. It layers an optional **overlay YAML file** on top of the base file, deep-merging by `tag` at every level (sections → groups → fields, including collector `parameters.fields`).

Given a base form:

```yaml
# forms/user-form.yaml
tag: user-form
sections:
  - tag: user_info
    groups:
      - tag: basic_data
        fields:
          - tag: rolePolicies
            name: Roles
            type: select-multiple
            options_source:
              type: repository
              class: hub-role-policy-provider
              method: active-options
              value_key: id
              label_key: name
```

An overlay file only needs to repeat the tags required to path down to what changes:

```yaml
# forms/user-form.tenant.yaml
tag: user-form
sections:
  - tag: user_info
    groups:
      - tag: basic_data
        fields:
          - tag: rolePolicies
            options_source:
              class: tenant-role-policy-provider
```

```ts
// Hub — no overlay file exists for "hub", resolves the base form unchanged
resolver.withScope('hub').resolve('user-form')

// Tenant — user-form.tenant.yaml is merged onto the base:
// rolePolicies.options_source.class becomes "tenant-role-policy-provider",
// everything else on that field (method, value_key, label_key, name, type...) is inherited
resolver.withScope('tenant').resolve('user-form')

// Never calling withScope() at all skips the overlay fetch entirely —
// identical behavior/network activity to versions before 1.2.0
resolver.resolve('user-form')
```

**Merge rules:**

- Sections, groups, fields, and collector `parameters.fields` are matched by `tag` at each level. A matching overlay item deep-merges onto the base item; a non-matching overlay item is **appended** (a new field/group/section only present in that scope).
- Scalar leaves on a matched item (`name`, `type`, `description`, `position`, `placeholder`, `default_value`, `enabled`, `interactions`) are overwritten only where the overlay explicitly sets them — anything the overlay omits is inherited from the base.
- `attributes`, `parameters`, `options_source`, and `translations` merge one level deep, so an overlay can change a single leaf (e.g. just `options_source.class`) without repeating its siblings.
- `style` and inline `options` arrays are **replaced wholesale** when the overlay sets them — never merged element by element.
- Setting `enabled: false` on an overlay item hides that item for the scope — this reuses the existing `enabled ?? true` filter, there is no separate "remove" flag.
- `position` is a plain scalar leaf like any other — an overlay can reorder fields for a scope by only setting `position` on the fields that move; resolution still sorts by `position` after the merge, so no extra step is needed.
- A missing overlay file (HTTP 404) is not an error — the form resolves as if `withScope()` had never been called for that tag.

---

## Form inheritance (`extends`)

`withScope()` is for the **same** form varying by platform/environment at runtime. `extends` is for when you actually want a **different, independently-addressable form** that happens to share most of its shape with another — e.g. a general-purpose edit form and a narrower "just this one section" variant of it, addressed and requested as two separate tags.

|                        | `withScope(scope)`                                   | `extends: <tag>`                                      |
|------------------------|-------------------------------------------------------|---------------------------------------------------------|
| Same tag or different? | Same `tag` — the resolver picks the variant            | Different `tag`, named explicitly in the derived file    |
| Who decides the variant | The resolver, at call time, from `withScope()` state  | The YAML author, at write time                           |
| Caller awareness       | Transparent — caller just calls `resolve('form-tag')`  | Explicit — caller requests the derived tag on purpose    |
| Missing file behavior  | HTTP 404 → falls back to the base silently             | Missing base tag → `resolve()` throws                    |
| Can combine with the other? | Yes — a derived (`extends`) form can still have its own scope overlay | Yes — applied after the inheritance chain resolves |

Use `withScope` when it's the same logical form varying by environment. Use `extends` when it's genuinely a different form that should share most of another's shape instead of duplicating it.

A form declares its base with a top-level `extends` field:

```yaml
# forms/base-form.yaml
tag: base-form
render:
  type: wizard
sections:
  - tag: general
    groups:
      - tag: fields
        fields:
          - tag: name
            name: Name
            type: string
  - tag: details
    groups:
      - tag: fields
        fields:
          - tag: notes
            name: Notes
            type: textarea
```

```yaml
# forms/base-form-details-only.yaml
tag: base-form-details-only
extends: base-form
render:
  type: default          # override — this variant isn't a wizard
sections:
  - tag: general
    enabled: false        # hide the section not relevant to this variant
```

```ts
resolver.resolve('base-form-details-only')
// -> tag: 'base-form-details-only' (its own tag, not the base's)
// -> render.type: 'default' (overridden)
// -> sections: only 'details' ('general' hidden via enabled: false)
// -> the 'notes' field and everything else on 'details' is inherited untouched
```

**Merge rules:** identical to scope overlays — the same `mergeRawForm` deep-merge by `tag` at every level (sections → groups → fields, including collector `parameters.fields`), same `enabled: false` hides an inherited item, same wholesale replacement for `style`/inline `options`. `extends` chains can be multiple levels deep (a form can extend a form that itself extends another); a circular chain (directly or transitively extending itself) throws instead of resolving.

---

## Extensibility

The `FormSchemaRegistry` is the container for all definitions. It is pre-populated with every built-in type. You can add your own at any level:

```ts
import {
  createFormSchemaResolver,
  FormSchemaRegistry,
  AbstractFieldType,
  AbstractRender,
} from '@letkode/form-schema'
import type {
  FieldType,
  OptionsSourceDefinition,
  FieldOption,
} from '@letkode/form-schema'

// --- Custom field type ---
class ColorPickerFieldType extends AbstractFieldType {
  getName(): FieldType { return 'color-picker' as FieldType }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', format: 'hex', alpha: false }
  }
}

// --- Custom render ---
class SidebarFormRender extends AbstractRender {
  getName() { return 'sidebar' }
  getDefaultMetadata() {
    return { width: 400, overlay: true }
  }
}

// --- Custom options source (e.g. fetch from an API) ---
class ApiOptionsSource implements OptionsSourceDefinition {
  getType() { return 'api' }
  async resolve(tag: string, _baseUrl: string): Promise<FieldOption[]> {
    const res = await fetch(`/api/options/${tag}`)
    const data = await res.json() as Array<{ id: string; name: string }>
    return data.map((item, i) => ({
      value: item.id,
      label: item.name,
      tag: null, icon: null, color: null,
      position: i + 1,
      data: {},
    }))
  }
}

// --- Wire everything together ---
const registry = new FormSchemaRegistry()
registry.registerFieldType(new ColorPickerFieldType())
registry.registerFormRender(new SidebarFormRender())
registry.registerOptionsSource(new ApiOptionsSource())

const resolver = createFormSchemaResolver({
  baseUrl: '/resources/form-schema',
  registry,
})
```

### `'custom'` — a built-in escape hatch instead of one type per widget

Registering a dedicated `FieldTypeDefinition`/`RenderDefinition` per widget (`ColorPickerFieldType` above) is the right call for a type you expect to reuse broadly and that has real default parameters/attributes worth centralizing. It doesn't scale as well when a project just needs to keep dropping in one-off, app-specific widgets — each one means touching the registry again.

For that case, `type: 'custom'` (fields) and `render.type: 'custom'` (sections/groups) are **already built in** — `CustomFieldType`, `CustomSectionRender`, and `CustomGroupRender` are part of `ALL_FIELD_TYPES`/`ALL_SECTION_RENDERS`/`ALL_GROUP_RENDERS`, pre-registered on every `FormSchemaRegistry` instance. No `registerFieldType()`/`registerSectionRender()`/`registerGroupRender()` call needed — just use `'custom'` directly:

```yaml
- tag: permissions
  type: custom
  parameters:
    key: permission-matrix   # the consuming app's own dispatch key — meaningless to this package
```

```yaml
sections:
  - tag: summary
    render:
      type: custom
      metadata:
        key: role-summary    # same convention — meaningless to this package
```

The consuming app's renderer does its own lookup (`field.type === 'custom'` → `PROJECT_REGISTRY[field.parameters.key]`, and the analogous `section.render.type`/`group.render.type` → `PROJECT_REGISTRY[render.metadata.key]`) before falling back to its normal per-`type` dispatch. Every future one-off widget only ever touches that project-side map — this package's registry and the `FieldType` union are never touched again, no matter how many custom widgets a project ends up building.

Use a dedicated class (`AbstractFieldType`/`AbstractRender`) when a type has real default parameters/metadata worth centralizing in the package; reach for `'custom'` + `key` when it doesn't.

---

## React / TanStack Query integration

```ts
// src/hooks/useFormSchema.ts
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createFormSchemaResolver } from '@letkode/form-schema'

const resolver = createFormSchemaResolver({
  baseUrl: '/resources/form-schema',
})

export function useFormSchema(
  tag: string,
  options: { context?: string; enabled?: boolean } = {}
) {
  const { i18n } = useTranslation()
  const { context, enabled = true } = options

  return useQuery({
    queryKey: ['form-schema', tag, i18n.language, context ?? null],
    queryFn: () => {
      let r = resolver.withLocale(i18n.language)
      if (context) r = r.withContext(context)
      return r.resolve(tag)
    },
    enabled,
    staleTime: Infinity,
  })
}
```

```tsx
// In a page component
import { useFormSchema } from '@/hooks/useFormSchema'
import { FormRenderer } from '@/components/forms/FormRenderer'

export function UserProfilePage() {
  const { data: schema, isLoading } = useFormSchema('user_profile', {
    context: 'create',
  })

  if (isLoading) return <Spinner />
  if (!schema) return null

  return <FormRenderer schema={schema} onSubmit={handleSubmit} />
}
```

---

## API reference

### `createFormSchemaResolver(config)`

Convenience factory. Returns a `FormSchemaResolver` with all built-in definitions pre-registered.

```ts
createFormSchemaResolver({
  baseUrl: string            // required — base URL where YAML files are served
  registry?: FormSchemaRegistry  // optional — extend with custom definitions
  repository?: {
    baseUrl: string             // base URL of the internal backend
    pathPattern: string         // e.g. '/form-options/:class/:method' — missing placeholders become query params
    getToken?: () => string | null           // returns the JWT sent as `Authorization: Bearer {token}`
    getHeaders?: () => Record<string, string> // extra headers sent on every request (e.g. tenant/identity headers
                                               // for multi-tenant backends); called fresh per request, merged
                                               // before `Authorization`
  }
  connections?: Record<string, {
    baseUrl: string              // base URL of the external API
    headers?: Record<string, string> // static headers sent on every request (API keys, tokens, etc.)
  }>
}): FormSchemaResolver
```

`repository` configures the built-in `repository` options source (`options_source: { type: 'repository' }`); `connections` configures the built-in `api` options source (`options_source: { type: 'api', connection: '<key>' }`), keyed by connection name. Both are optional — omit them if a form never uses those source types.

```ts
const resolver = createFormSchemaResolver({
  baseUrl: '/resources/form-schema',
  repository: {
    baseUrl: process.env.API_URL!,
    pathPattern: '/form-options/:class/:method',
    getToken: () => localStorage.getItem('jwt'),
    getHeaders: () => ({ 'X-Tenant-Schema': getActiveTenant() }),
  },
  connections: {
    geo: { baseUrl: 'https://geo.example.com', headers: { 'X-Api-Key': GEO_API_KEY } },
  },
})
```

---

### `FormSchemaResolver`

Immutable fluent builder. Each method returns a **new instance** — the original is not mutated.

| Method | Description |
|---|---|
| `.withLocale(locale: string)` | Set the locale for translation resolution |
| `.withContext(context: string)` | Activate a context to apply `attributes.actions[context]` overrides |
| `.withScope(scope: string)` | Activate scope-based overlay resolution; attempts to load `{tag}.{scope}.yaml` and deep-merges it onto the base file by `tag` (see [Scope overlays](#scope-overlays)) |
| `.includingSections(tags: string[])` | Only include sections with these tags |
| `.excludingSections(tags: string[])` | Exclude sections with these tags |
| `.resolve(formTag: string)` | Fetch, parse, and resolve the YAML — returns `Promise<FormSchema>`. Also follows the form's `extends` chain (if any), merging each ancestor onto its base before applying scope overlays (see [Form inheritance](#form-inheritance-extends)) |

---

### `FormSchemaRegistry`

| Method | Description |
|---|---|
| `.registerFieldType(def)` | Add or replace a field type by name |
| `.registerFormRender(def)` | Add or replace a form-level render |
| `.registerSectionRender(def)` | Add or replace a section-level render |
| `.registerGroupRender(def)` | Add or replace a group-level render |
| `.registerInteractionHandler(def)` | Register a known interaction action name |
| `.registerOptionsSource(def)` | Add or replace an options source by type |

All registration methods return `this` for chaining.

---

## Output JSON shape

```jsonc
{
  "id": "user_profile",
  "name": "User Profile",
  "tag": "user_profile",
  "locale": "en",
  "default_locale": "en",
  "enabled": true,
  "parameters": {},
  "render": {
    "type": "stepper",
    "metadata": { "orientation": "horizontal", "show_progress": true, "allow_skip": false, "persist_on_navigate": true }
  },
  "translations": { "es": { "name": "Perfil de Usuario" } },
  "sections": [
    {
      "id": "personal_data",
      "name": "Personal Data",
      "tag": "personal_data",
      "description": null,
      "position": 1,
      "enabled": true,
      "parameters": {},
      "render": { "type": "accordion", "metadata": { "allow_multiple_open": false, "first_open": true } },
      "translations": {},
      "groups": [
        {
          "id": "basic_info",
          "name": "Basic Information",
          "tag": "basic_info",
          "description": null,
          "position": 1,
          "enabled": true,
          "parameters": {},
          "render": { "type": "fieldset", "metadata": { "legend": true, "legend_custom": null } },
          "translations": {},
          "fields": [
            {
              "id": "first_name",
              "name": "First Name",
              "tag": "first_name",
              "type": "string",
              "description": null,
              "position": 1,
              "enabled": true,
              "placeholder": null,
              "default_value": null,
              "style": ["w-1/2"],
              "attributes": {
                "required": true,
                "readonly": false,
                "unique": { "enabled": false, "entity": null, "method": null },
                "filter": { "enabled": false, "key": null },
                "actions": { "show": { "readonly": true } }
              },
              "parameters": { "label_style": "default", "max_length": 255, "min_length": null },
              "options": [],
              "interactions": [],
              "translations": { "es": { "name": "Nombre" } }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## License

MIT
