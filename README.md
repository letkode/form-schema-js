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

All types share `label_style: 'default'` as a base parameter.

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
      text: item.name,
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
}): FormSchemaResolver
```

---

### `FormSchemaResolver`

Immutable fluent builder. Each method returns a **new instance** — the original is not mutated.

| Method | Description |
|---|---|
| `.withLocale(locale: string)` | Set the locale for translation resolution |
| `.withContext(context: string)` | Activate a context to apply `attributes.actions[context]` overrides |
| `.includingSections(tags: string[])` | Only include sections with these tags |
| `.excludingSections(tags: string[])` | Exclude sections with these tags |
| `.resolve(formTag: string)` | Fetch, parse, and resolve the YAML — returns `Promise<FormSchema>` |

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
