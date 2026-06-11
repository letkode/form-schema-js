export { YamlCatalogSource } from './YamlCatalogSource.js'
export type { OptionsSourceDefinition } from './YamlCatalogSource.js'
export { RepositoryOptionsSource } from './RepositoryOptionsSource.js'
export { ApiOptionsSource } from './ApiOptionsSource.js'

import { YamlCatalogSource } from './YamlCatalogSource.js'
import { RepositoryOptionsSource } from './RepositoryOptionsSource.js'
import { ApiOptionsSource } from './ApiOptionsSource.js'
import type { OptionsSourceDefinition } from './YamlCatalogSource.js'

export const ALL_OPTIONS_SOURCES: OptionsSourceDefinition[] = [
  new YamlCatalogSource(),
  new RepositoryOptionsSource(),
  new ApiOptionsSource(),
]
