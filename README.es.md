# @letkode/form-schema

Paquete JavaScript agnóstico de framework que lee definiciones de formularios en YAML y las resuelve en un **FormSchema JSON** completamente estructurado — listo para ser consumido por cualquier renderizador de formularios.

Inspirado en el bundle PHP [`letkode/form-schema-bundle`](https://github.com/letkode/form-schema-bundle), este paquete porta el mismo pipeline de resolución de esquemas al navegador.

---

## Tabla de contenidos

- [¿Cómo funciona?](#cómo-funciona)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Referencia YAML](#referencia-yaml)
  - [Archivo de formulario](#archivo-de-formulario)
  - [Archivo de opciones](#archivo-de-opciones)
- [Tipos de campo](#tipos-de-campo)
- [Tipos de render](#tipos-de-render)
- [Interacciones](#interacciones)
- [Campos sensibles al contexto](#campos-sensibles-al-contexto)
- [Extensibilidad](#extensibilidad)
- [Integración con React / TanStack Query](#integración-con-react--tanstack-query)
- [Referencia de API](#referencia-de-api)
- [Estructura del JSON de salida](#estructura-del-json-de-salida)

---

## ¿Cómo funciona?

```
public/resources/form-schema/
  forms/user_profile.yaml        ← tú escribes esto
  options/countries.yaml         ← tú escribes esto
         │
         ▼
  FormSchemaResolver             ← este paquete
  (enriquece con los defaults
   de FieldType, resuelve opciones,
   fusiona metadata de renders)
         │
         ▼
  JSON FormSchema                ← tu renderizador lo consume
```

El resolver:
1. Descarga el YAML mediante `fetch()` (nativo del navegador, no requiere `fs` de Node.js)
2. Fusiona los defaults de cada definición `FieldType` (parámetros, atributos)
3. Resuelve referencias `options_source` descargando el YAML de opciones correspondiente
4. Fusiona los defaults de metadata de render para cada tipo de render
5. Aplica traducciones según el locale activo y los overrides de contexto
6. Ordena secciones, grupos y campos por `position`
7. Retorna un objeto `FormSchema` tipado

---

## Instalación

```bash
npm install @letkode/form-schema
# o
pnpm add @letkode/form-schema
# o
yarn add @letkode/form-schema
```

---

## Inicio rápido

```ts
import { createFormSchemaResolver } from '@letkode/form-schema'

const resolver = createFormSchemaResolver({
  baseUrl: '/resources/form-schema',  // desde donde se sirven los archivos YAML
})

const schema = await resolver
  .withLocale('es')
  .withContext('create')
  .resolve('user_profile')   // carga /resources/form-schema/forms/user_profile.yaml

console.log(JSON.stringify(schema, null, 2))
```

---

## Estructura del proyecto

Coloca tus archivos YAML dentro del directorio `public/` de tu proyecto para que sean servidos estáticamente:

```
tu-proyecto/
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

## Referencia YAML

### Archivo de formulario

**Campos mínimos requeridos**: `tag`, `name`, al menos una sección con un grupo y un campo.

```yaml
# public/resources/form-schema/forms/user_profile.yaml

tag: user_profile             # identificador único, también se usa como id del formulario
name: User Profile            # nombre visible
enabled: true                 # false = se omite completamente
default_locale: en            # locale de respaldo para traducciones
parameters: {}                # clave/valor arbitrario que pasa al JSON

render:
  type: stepper               # render de nivel formulario: default | stepper | wizard | tabs
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
    description: null          # subtítulo opcional
    parameters: {}

    render:
      type: accordion          # render de sección: default | accordion | collapsible | tabs
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
          type: fieldset       # render de grupo: default | fieldset | matrix
          metadata:
            legend: true
            legend_custom: null

        fields:
          - tag: first_name
            name: First Name
            type: string       # ver Tipos de campo más abajo
            position: 1
            enabled: true
            placeholder: Ingresa tu nombre
            default_value: null
            style: [w-1/2]     # clases Tailwind de ancho aplicadas al contenedor del campo

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
              actions:         # overrides por contexto — abierto, cualquier clave funciona
                create:
                  required: true
                edit:
                  required: true
                show:
                  readonly: true
                mi_contexto_custom:
                  enabled: false

            parameters:        # se fusiona encima de los defaults del FieldType
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

          - tag: pais
            name: Country
            type: select
            position: 2
            style: [w-1/2]

            # Opciones inline (tienen prioridad sobre options_source)
            options:
              - value: us
                label: United States
                position: 1
                data: {}
              - value: es
                label: España
                position: 2
                data: {}

          - tag: rol
            name: Role
            type: radio
            position: 3
            style: [w-full]

            # Referencia a un catálogo de opciones
            options_source:
              type: catalog    # tipo integrado; extensible vía registerOptionsSource()
              tag: roles       # carga /resources/form-schema/options/roles.yaml
```

---

### Archivo de opciones

```yaml
# public/resources/form-schema/options/countries.yaml

tag: countries
name: Countries
values:
  - value: us
    label: United States
    position: 1
    tag: null          # tag de legibilidad máquina para esta opción (opcional)
    icon: null         # identificador de ícono (opcional)
    color: null        # color (hex / color CSS) (opcional)
    data:              # datos arbitrarios para filtrado client-side
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

## Tipos de campo

| Tipo | `takesOptions` | Parámetros default destacados |
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
| `select` | **Sí** | — |
| `select-multiple` | **Sí** | default_value → `[]` |
| `combobox` | **Sí** | `searchable: true`, `api_url: null` |
| `radio` | **Sí** | `layout: 'vertical'` |
| `checkbox` | **Sí** | `layout: 'vertical'`, default_value → `[]` |
| `switch` | No | default_value → `false` |
| `duallist` | **Sí** | `max_count_items: null`, default_value → `[]` |
| `tree` | **Sí** | default_value → `[]` |
| `rating` | No | `max: 5` |
| `file` | No | `accept: null`, `multiple: false` |

Todos los tipos comparten `label_style: 'default'` como parámetro base.

---

## Tipos de render

### Renders de formulario (`render.type` a nivel formulario)

| Tipo | Metadata por defecto |
|---|---|
| `default` | — |
| `stepper` | `orientation: 'horizontal'`, `show_progress: true`, `allow_skip: false`, `persist_on_navigate: true` |
| `wizard` | `orientation: 'horizontal'`, `show_progress: true`, `allow_skip: false`, `persist_on_navigate: false` |
| `tabs` | `orientation: 'horizontal'`, `lazy_load: false` |

### Renders de sección (`render.type` a nivel sección)

| Tipo | Metadata por defecto |
|---|---|
| `default` | — |
| `accordion` | `allow_multiple_open: false`, `first_open: true` |
| `collapsible` | `default_collapsed: false` |
| `tabs` | `orientation: 'horizontal'`, `lazy_load: false` |

### Renders de grupo (`render.type` a nivel grupo)

| Tipo | Metadata por defecto |
|---|---|
| `default` | — |
| `fieldset` | `legend: false`, `legend_custom: null` |
| `matrix` | `rows: []`, `cols: []` |

---

## Interacciones

Las interacciones definen comportamientos dinámicos que el renderizador evalúa en el cliente. El resolver valida que cada `action` esté registrada y pasa la interacción al JSON de salida tal cual.

```yaml
interactions:
  - trigger: change         # change | blur | focus
    action: toggle_visibility
    target: bio             # tag del campo — null para aplicar a sí mismo, o un array de tags
    condition:
      operator: falsy       # truthy | falsy — omitir para "ejecutar siempre"
    params: {}
```

### Acciones disponibles

| Acción | `params` |
|---|---|
| `toggle_visibility` | — |
| `toggle_required` | — |
| `set_value` | `{ value: <cualquier valor> }` |
| `filter_options` | `{ mode: 'client' \| 'server', filter_key?: string, filter_param?: string }` |
| `set_date_constraint` | `{ constraint: 'min' \| 'max' }` |
| `compute` | `{ expression: string, sources: string[], decimals: number \| null }` |
| `ajax_validate` | `{ endpoint: string, method: string }` |

**`filter_options` — modo client**: filtra las opciones de otro campo usando `option.data[filter_key]` comparado contra el valor actual de este campo.

**`compute`**: evalúa una expresión aritmética con marcadores `{tag_del_campo}`. Ejemplo:
```yaml
action: compute
target: total
params:
  expression: "{salario_base} + {bono}"
  sources: [salario_base, bono]
  decimals: 2
```

---

## Campos sensibles al contexto

El mismo formulario puede comportarse de manera diferente según el `context` que se pase al resolver. Los contextos son completamente abiertos — define las claves que tengan sentido para tu aplicación.

```yaml
attributes:
  required: true
  actions:
    create:
      required: true
    edit:
      required: false    # contraseña opcional en edición
    show:
      readonly: true
    wizard_paso_2:       # cualquier contexto personalizado que definas
      enabled: false
```

```ts
// Contexto de creación
resolver.withContext('create').resolve('user_profile')

// Contexto de edición — la contraseña se vuelve opcional
resolver.withContext('edit').resolve('user_profile')

// Cualquier contexto personalizado
resolver.withContext('wizard_paso_2').resolve('user_profile')
```

Cuando un contexto está activo, los overrides de `attributes.actions[context]` se fusionan en los valores `required` y `readonly` del campo antes de retornar el esquema.

---

## Extensibilidad

El `FormSchemaRegistry` es el contenedor de todas las definiciones. Viene pre-cargado con todos los tipos integrados. Puedes agregar los tuyos en cualquier nivel:

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

// --- Tipo de campo personalizado ---
class ColorPickerFieldType extends AbstractFieldType {
  getName(): FieldType { return 'color-picker' as FieldType }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', format: 'hex', alpha: false }
  }
}

// --- Render personalizado ---
class SidebarFormRender extends AbstractRender {
  getName() { return 'sidebar' }
  getDefaultMetadata() {
    return { width: 400, overlay: true }
  }
}

// --- Fuente de opciones personalizada (ej. desde una API) ---
class ApiOptionsSource implements OptionsSourceDefinition {
  getType() { return 'api' }
  async resolve(tag: string, _baseUrl: string): Promise<FieldOption[]> {
    const res = await fetch(`/api/options/${tag}`)
    const data = await res.json() as Array<{ id: string; nombre: string }>
    return data.map((item, i) => ({
      value: item.id,
      text: item.nombre,
      tag: null, icon: null, color: null,
      position: i + 1,
      data: {},
    }))
  }
}

// --- Registrar todo junto ---
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

## Integración con React / TanStack Query

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
// En un componente de página
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

## Referencia de API

### `createFormSchemaResolver(config)`

Factory de conveniencia. Retorna un `FormSchemaResolver` con todas las definiciones integradas pre-registradas.

```ts
createFormSchemaResolver({
  baseUrl: string                    // requerido — URL base desde donde se sirven los YAML
  registry?: FormSchemaRegistry      // opcional — extiende con definiciones personalizadas
}): FormSchemaResolver
```

---

### `FormSchemaResolver`

Builder fluido inmutable. Cada método retorna una **nueva instancia** — el original no se muta.

| Método | Descripción |
|---|---|
| `.withLocale(locale: string)` | Define el locale para resolución de traducciones |
| `.withContext(context: string)` | Activa un contexto para aplicar overrides de `attributes.actions[context]` |
| `.includingSections(tags: string[])` | Solo incluye secciones con estos tags |
| `.excludingSections(tags: string[])` | Excluye secciones con estos tags |
| `.resolve(formTag: string)` | Descarga, parsea y resuelve el YAML — retorna `Promise<FormSchema>` |

---

### `FormSchemaRegistry`

| Método | Descripción |
|---|---|
| `.registerFieldType(def)` | Agrega o reemplaza un tipo de campo por nombre |
| `.registerFormRender(def)` | Agrega o reemplaza un render a nivel formulario |
| `.registerSectionRender(def)` | Agrega o reemplaza un render a nivel sección |
| `.registerGroupRender(def)` | Agrega o reemplaza un render a nivel grupo |
| `.registerInteractionHandler(def)` | Registra un nombre de acción de interacción conocida |
| `.registerOptionsSource(def)` | Agrega o reemplaza una fuente de opciones por tipo |

Todos los métodos de registro retornan `this` para encadenamiento.

---

## Estructura del JSON de salida

```jsonc
{
  "id": "user_profile",
  "name": "Perfil de Usuario",
  "tag": "user_profile",
  "locale": "es",
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
      "name": "Datos Personales",
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
          "name": "Información Básica",
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
              "name": "Nombre",
              "tag": "first_name",
              "type": "string",
              "description": null,
              "position": 1,
              "enabled": true,
              "placeholder": "Ingresa tu nombre",
              "default_value": null,
              "style": ["w-1/2"],
              "attributes": {
                "required": true,
                "readonly": false,
                "unique": { "enabled": false, "entity": null, "method": null },
                "filter": { "enabled": false, "key": null },
                "actions": { "show": { "readonly": true } }
              },
              "parameters": { "label_style": "default", "max_length": 100, "min_length": null },
              "options": [],
              "interactions": [],
              "translations": { "es": { "name": "Nombre", "placeholder": "Ingresa tu nombre" } }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Licencia

MIT
