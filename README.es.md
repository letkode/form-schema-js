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
- [Overlays por scope](#overlays-por-scope)
- [Herencia de formularios (`extends`)](#herencia-de-formularios-extends)
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
extends: base_form_tag        # opcional — hereda de otro formulario por tag, ver "Herencia de formularios" más abajo

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
| `collector` | No | `layout: 'horizontal'`, `add_label: 'Add item'`, `min_items: null`, `max_items: null`, `fields: []` |
| `repeater` | No | `add_label: 'Add item'`, `min_items: null`, `max_items: null`, `field: null`, default_value → `[]` |

Todos los tipos comparten `label_style: 'default'` como parámetro base.

### El tipo de campo `collector`

`collector` renderiza un grupo repetible de sub-campos (ej. "agregar otro número de teléfono"). Su `parameters.fields` es un array de objetos `RawField` — la misma forma que cualquier `fields` de un grupo — que el resolver resuelve recursivamente en objetos `FormField` completos al momento de resolución:

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

### El tipo de campo `repeater`

`repeater` es el hermano de un solo campo de `collector`. Donde `collector`
repite un *grupo* de sub-campos (cada fila es un objeto con clave por tag de
sub-campo), `repeater` repite *un* campo — `parameters.field`, un único
`RawField` resuelto recursivamente en un `FormField` completo — y su valor es un
**array plano de los valores de ese campo**:

```yaml
- tag: subcontractors
  name: Subcontractors
  type: repeater
  position: 1
  attributes:
    required: true
  parameters:
    add_label: Add subcontractor
    min_items: 1
    field:
      tag: company
      name: Subcontractor
      type: select
      options_source:
        type: api_internal
        provider: form-options
        class: tenant-company-provider
        method: visible-options
        pre_load: false
        value_key: id
        label_key: label
```

Forma del valor resuelto: `collector` → `[{ number: "...", label: "..." }, ...]`;
`repeater` → `["uuid-a", "uuid-b", ...]`.

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

## Overlays por scope

`withContext()` sirve para variar atributos como `required`/`readonly` dentro del mismo archivo. Cuando un formulario necesita una forma genuinamente distinta según un scope de nivel plataforma — por ejemplo un despliegue hub vs. tenant, o cualquier otra separación multi-entorno — usa `withScope(scope)` en su lugar. Este método superpone un **archivo YAML de overlay** opcional sobre el archivo base, fusionándolo (deep-merge) por `tag` en cada nivel (sections → groups → fields, incluyendo `parameters.fields` de collectors).

Dado un formulario base:

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

Un archivo overlay solo necesita repetir los tags necesarios para llegar a lo que cambia:

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
// Hub — no existe archivo overlay para "hub", resuelve el formulario base sin cambios
resolver.withScope('hub').resolve('user-form')

// Tenant — user-form.tenant.yaml se fusiona sobre el base:
// rolePolicies.options_source.class pasa a ser "tenant-role-policy-provider",
// todo lo demás de ese campo (method, value_key, label_key, name, type...) se hereda
resolver.withScope('tenant').resolve('user-form')

// Nunca llamar a withScope() evita por completo el fetch del overlay —
// comportamiento/tráfico de red idéntico a versiones anteriores a la 1.2.0
resolver.resolve('user-form')
```

**Reglas de fusión:**

- Sections, groups, fields y `parameters.fields` de collectors se emparejan por `tag` en cada nivel. Un item del overlay que matchea se fusiona (deep-merge) sobre el item base; uno que no matchea se **agrega** (un campo/grupo/section nuevo, presente solo en ese scope).
- Las claves escalares de un item matcheado (`name`, `type`, `description`, `position`, `placeholder`, `default_value`, `enabled`, `interactions`) se sobrescriben solo donde el overlay las define explícitamente — lo que el overlay omite se hereda del base.
- `attributes`, `parameters`, `options_source` y `translations` se fusionan un nivel de profundidad, así un overlay puede cambiar un solo leaf (por ejemplo `options_source.class`) sin repetir sus hermanos.
- `style` y las `options` inline se **reemplazan completas** cuando el overlay las define — nunca se fusionan elemento por elemento.
- Poner `enabled: false` en un item del overlay oculta ese item para el scope — reutiliza el filtro `enabled ?? true` ya existente, no hay un flag separado de "remove".
- `position` es un leaf escalar más — un overlay puede reordenar campos para un scope seteando `position` solo en los campos que se mueven; la resolución sigue ordenando por `position` después del merge, no hace falta ningún paso extra.
- Un archivo overlay faltante (HTTP 404) no es un error — el formulario se resuelve como si `withScope()` nunca se hubiera llamado para ese tag.

---

## Herencia de formularios (`extends`)

`withScope()` sirve para el **mismo** formulario variando por plataforma/entorno en runtime. `extends` sirve para cuando en realidad quieres un **formulario distinto, direccionable de forma independiente**, que comparte la mayor parte de su forma con otro — por ejemplo un formulario de edición general y una variante más acotada ("solo esta sección") del mismo, solicitados como dos tags separados.

|                          | `withScope(scope)`                                     | `extends: <tag>`                                        |
|--------------------------|----------------------------------------------------------|-------------------------------------------------------------|
| ¿Mismo tag o distinto?    | Mismo `tag` — el resolver elige la variante               | `tag` distinto, nombrado explícitamente en el archivo derivado |
| ¿Quién decide la variante? | El resolver, en tiempo de llamada, según el estado de `withScope()` | El autor del YAML, en tiempo de escritura                  |
| ¿El caller lo sabe?       | Transparente — el caller solo llama `resolve('form-tag')`  | Explícito — el caller pide el tag derivado a propósito       |
| Archivo faltante          | HTTP 404 → cae al base en silencio                        | Tag base faltante → `resolve()` lanza error                  |
| ¿Se pueden combinar?      | Sí — un formulario derivado (`extends`) puede tener su propio overlay de scope | Sí — se aplica después de resolver la cadena de herencia |

Usa `withScope` cuando es el mismo formulario lógico variando por entorno. Usa `extends` cuando es genuinamente un formulario distinto que debería compartir la mayor parte de la forma de otro en vez de duplicarla.

Un formulario declara su base con un campo `extends` de nivel raíz:

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
  type: default          # override — esta variante no es un wizard
sections:
  - tag: general
    enabled: false        # oculta la sección que no aplica a esta variante
```

```ts
resolver.resolve('base-form-details-only')
// -> tag: 'base-form-details-only' (el propio, no el del base)
// -> render.type: 'default' (sobrescrito)
// -> sections: solo 'details' ('general' oculta vía enabled: false)
// -> el campo 'notes' y todo lo demás de 'details' se hereda sin cambios
```

**Reglas de merge:** idénticas a los overlays por scope — el mismo deep-merge de `mergeRawForm` por `tag` en cada nivel (sections → groups → fields, incluyendo `parameters.fields` de collectors), el mismo `enabled: false` oculta un item heredado, el mismo reemplazo completo para `style`/`options` inline. Las cadenas de `extends` pueden tener varios niveles de profundidad (un formulario puede extender a otro que a su vez extiende a otro); una cadena circular (directa o transitivamente extendiéndose a sí misma) lanza un error en vez de resolver.

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
      label: item.nombre,
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

### `'custom'` — una válvula de escape ya integrada, en vez de un tipo por widget

Registrar un `FieldTypeDefinition`/`RenderDefinition` dedicado por widget (`ColorPickerFieldType` arriba) es lo correcto para un tipo que esperás reusar ampliamente y que tiene defaults/atributos reales que vale la pena centralizar. No escala tan bien cuando un proyecto solo necesita ir agregando widgets propios, uno a uno — cada uno implica volver a tocar el registry.

Para ese caso, `type: 'custom'` (fields) y `render.type: 'custom'` (sections/groups) **ya vienen integrados** — `CustomFieldType`, `CustomSectionRender` y `CustomGroupRender` forman parte de `ALL_FIELD_TYPES`/`ALL_SECTION_RENDERS`/`ALL_GROUP_RENDERS`, pre-registrados en cada instancia de `FormSchemaRegistry`. No hace falta ningún `registerFieldType()`/`registerSectionRender()`/`registerGroupRender()` — se usa `'custom'` directamente:

```yaml
- tag: permissions
  type: custom
  parameters:
    key: permission-matrix   # key de despacho propia de la app consumidora — no significa nada para este paquete
```

```yaml
sections:
  - tag: summary
    render:
      type: custom
      metadata:
        key: role-summary    # misma convención — no significa nada para este paquete
```

El renderer de la app consumidora hace su propia búsqueda (`field.type === 'custom'` → `PROJECT_REGISTRY[field.parameters.key]`, y de forma análoga `section.render.type`/`group.render.type` → `PROJECT_REGISTRY[render.metadata.key]`) antes de caer en su dispatch normal por `type`. Cada widget custom futuro solo toca ese mapa del lado del proyecto — el registry de este paquete y la union `FieldType` nunca se vuelven a tocar, sin importar cuántos widgets custom termine construyendo el proyecto.

Usá una clase dedicada (`AbstractFieldType`/`AbstractRender`) cuando un tipo tiene defaults/metadata reales que vale la pena centralizar en el paquete; usá `'custom'` + `key` cuando no.

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
  repository?: {
    baseUrl: string             // URL base del backend interno
    pathPattern: string         // ej. '/form-options/:class/:method' — placeholders ausentes se envían como query params
    getToken?: () => string | null            // retorna el JWT enviado como `Authorization: Bearer {token}`
    getHeaders?: () => Record<string, string> // headers extra enviados en cada request (ej. headers de
                                               // tenant/identidad para backends multi-tenant); se llama de
                                               // nuevo en cada request, se fusiona antes de `Authorization`
  }
  connections?: Record<string, {
    baseUrl: string                  // URL base de la API externa
    headers?: Record<string, string> // headers estáticos enviados en cada request (API keys, tokens, etc.)
  }>
}): FormSchemaResolver
```

`repository` configura la fuente de opciones integrada `repository` (`options_source: { type: 'repository' }`); `connections` configura la fuente integrada `api` (`options_source: { type: 'api', connection: '<key>' }`), indexada por nombre de conexión. Ambos son opcionales — se pueden omitir si un formulario nunca usa esos tipos de fuente.

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

Builder fluido inmutable. Cada método retorna una **nueva instancia** — el original no se muta.

| Método | Descripción |
|---|---|
| `.withLocale(locale: string)` | Define el locale para resolución de traducciones |
| `.withContext(context: string)` | Activa un contexto para aplicar overrides de `attributes.actions[context]` |
| `.withScope(scope: string)` | Activa la resolución de overlays por scope; intenta cargar `{tag}.{scope}.yaml` y lo fusiona sobre el archivo base por `tag` (ver [Overlays por scope](#overlays-por-scope)) |
| `.includingSections(tags: string[])` | Solo incluye secciones con estos tags |
| `.excludingSections(tags: string[])` | Excluye secciones con estos tags |
| `.resolve(formTag: string)` | Descarga, parsea y resuelve el YAML — retorna `Promise<FormSchema>`. También sigue la cadena `extends` del formulario (si tiene), fusionando cada ancestro sobre su base antes de aplicar los overlays de scope (ver [Herencia de formularios](#herencia-de-formularios-extends)) |

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
