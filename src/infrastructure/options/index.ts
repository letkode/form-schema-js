export { YamlCatalogSource } from './YamlCatalogSource.js'
export type { OptionsSourceDefinition } from './YamlCatalogSource.js'
export { ApiInternalOptionsSource } from './ApiInternalOptionsSource.js'
export { ApiExternalOptionsSource } from './ApiExternalOptionsSource.js'

import { YamlCatalogSource } from './YamlCatalogSource.js'
import { ApiInternalOptionsSource } from './ApiInternalOptionsSource.js'
import { ApiExternalOptionsSource } from './ApiExternalOptionsSource.js'
import type { OptionsSourceDefinition } from './YamlCatalogSource.js'

export const ALL_OPTIONS_SOURCES: OptionsSourceDefinition[] = [
  new YamlCatalogSource(),
  new ApiInternalOptionsSource(),
  new ApiExternalOptionsSource(),
]
