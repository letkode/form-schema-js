# Migración: `repository` → `api_internal`, `api` → `api_external`

Breaking change, sin alias de compatibilidad. Actualizar YAMLs y config del resolver antes de subir de versión (`@letkode/form-schema@1.7.0`).

## Por qué

`repository` ya no describe bien el tipo — hoy conviven dos formas de resolver `options_source`:
un backend propio autenticado, y APIs externas por conexión. Los nombres ahora son explícitos:
`api_internal` (antes `repository`) y `api_external` (antes `api`).

## Cambios

### 1. YAML — `options_source.type`

```diff
 options_source:
-  type: repository
+  type: api_internal
   class: hub-role-policy-provider
   method: active-options
```

```diff
 options_source:
-  type: api
+  type: api_external
   connection: crm
   endpoint: /v1/contacts
```

Buscar en todos los YAML de forms/options: `type: repository` y `type: api` (y sus variantes con comillas `'repository'`/`'api'`).

### 2. Config del resolver — `repository` → `apiInternal`

```diff
 createFormSchemaResolver({
   baseUrl: '/resources/form-schema',
-  repository: {
+  apiInternal: {
     baseUrl: process.env.API_URL!,
     pathPattern: '/form-options/:class/:method',
     getToken: () => localStorage.getItem('jwt'),
     getHeaders: () => ({ 'X-Tenant-Schema': getActiveTenant() }),
   },
   connections: { ... },
 })
```

`connections` (para `api_external`) no cambia de nombre.

### 3. Tipos/clases exportadas (si se importan directamente)

| Antes | Ahora |
|---|---|
| `RepositoryConfig` | `ApiInternalConfig` |
| `RepositoryOptionsSource` | `ApiInternalOptionsSource` |
| `ApiOptionsSource` | `ApiExternalOptionsSource` |
| `ResolverConfig.repository` | `ResolverConfig.apiInternal` |
| `CreateResolverConfig.repository` | `CreateResolverConfig.apiInternal` |

### 4. Nuevo parámetro: `provider`

`options_source` para `api_internal` ahora acepta `provider`, con el mismo comportamiento de
placeholder que `class`/`method`:

```yaml
options_source:
  type: api_internal
  provider: form-options
  class: hub-role-policy-provider
  method: active-options
```

- Si `apiInternal.pathPattern` incluye `:provider`, se sustituye ahí (ej. `/:provider/:class/:method`).
- **Diferencia importante con `class`/`method`**: si el `pathPattern` configurado NO tiene `:provider`,
  el valor de `provider` se **ignora por completo** — a diferencia de `class`/`method`, que si no
  tienen placeholder se agregan como query param (`?class=...&method=...`). `provider` nunca se
  agrega como query param.
- Es opcional: si no se usa `:provider` en el `pathPattern` del proyecto, no hace falta enviarlo.

## Checklist para cada proyecto consumidor

- [ ] Reemplazar `type: repository` → `type: api_internal` en todos los YAML de `options_source`
- [ ] Reemplazar `type: api` → `type: api_external` en todos los YAML de `options_source`
- [ ] Renombrar la key `repository` → `apiInternal` en la config pasada a `createFormSchemaResolver()`
- [ ] Si se importan `RepositoryConfig`/`RepositoryOptionsSource`/`ApiOptionsSource` directamente, actualizar a los nuevos nombres
- [ ] (Opcional) Si el backend expone varios providers bajo una misma ruta, agregar `:provider` al `pathPattern` y setear `provider` en los `options_source` que lo necesiten
- [ ] Correr build/typecheck del proyecto consumidor tras el bump de versión de `@letkode/form-schema`
