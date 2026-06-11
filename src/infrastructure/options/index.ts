export { YamlCatalogSource } from './YamlCatalogSource.js'
export type { OptionsSourceDefinition } from './YamlCatalogSource.js'

import { YamlCatalogSource } from './YamlCatalogSource.js'
import type { OptionsSourceDefinition } from './YamlCatalogSource.js'

export const ALL_OPTIONS_SOURCES: OptionsSourceDefinition[] = [
  new YamlCatalogSource(),
]
