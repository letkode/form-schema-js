// Domain types
export type * from './domain/types.js'

// Application layer
export { FormSchemaResolver } from './application/resolver/FormSchemaResolver.js'
export { FormSchemaRegistry, UnknownFieldTypeError } from './application/registry/FormSchemaRegistry.js'
export { YamlLoader } from './application/loader/YamlLoader.js'

// Infrastructure — field types
export * from './infrastructure/field-types/index.js'

// Infrastructure — renders
export { AbstractRender } from './infrastructure/renders/RenderDefinition.js'
export type { RenderDefinition } from './infrastructure/renders/RenderDefinition.js'
export * from './infrastructure/renders/form/index.js'
export * from './infrastructure/renders/section/index.js'
export * from './infrastructure/renders/group/index.js'

// Infrastructure — interactions
export type { InteractionHandlerDefinition } from './infrastructure/interactions/index.js'
export { ALL_INTERACTION_HANDLERS } from './infrastructure/interactions/index.js'

// Infrastructure — options
export { YamlCatalogSource } from './infrastructure/options/index.js'
export type { OptionsSourceDefinition } from './infrastructure/options/index.js'

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

import { FormSchemaRegistry } from './application/registry/FormSchemaRegistry.js'
import { FormSchemaResolver } from './application/resolver/FormSchemaResolver.js'

export interface CreateResolverConfig {
  /** Base URL where form-schema YAML files are served from (e.g. '/resources/form-schema') */
  baseUrl: string
  /** Optional pre-configured registry. If omitted a default registry with all built-ins is used. */
  registry?: FormSchemaRegistry
}

/**
 * Create a ready-to-use FormSchemaResolver with all built-in field types,
 * renders, interaction handlers, and the YAML catalog options source.
 *
 * @example
 * const resolver = createFormSchemaResolver({ baseUrl: '/resources/form-schema' })
 * const schema = await resolver.withLocale('es').withContext('create').resolve('user_profile')
 */
export function createFormSchemaResolver(config: CreateResolverConfig): FormSchemaResolver {
  const registry = config.registry ?? new FormSchemaRegistry()
  return new FormSchemaResolver({ registry, baseUrl: config.baseUrl })
}
