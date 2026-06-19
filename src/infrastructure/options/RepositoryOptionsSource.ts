import { normalizeApiResponse } from '../../utils/normalizeApiResponse.js'
import type {
  FieldOption,
  RawOptionsSource,
  ResolvedOptionsSource,
  ResolverExternalConfig,
  RepositoryConfig,
} from '../../domain/types.js'
import type { OptionsSourceDefinition } from './YamlCatalogSource.js'

export class RepositoryOptionsSource implements OptionsSourceDefinition {
  getType() { return 'repository' }
  isAlwaysPreLoad() { return false }

  async resolve(source: RawOptionsSource, config: ResolverExternalConfig): Promise<FieldOption[]> {
    if (!config.repository) {
      throw new Error('[form-schema] resolver.repository config is required to use options_source type "repository"')
    }
    const url = this.buildUrl(source, config.repository)
    const token = config.repository.getToken?.()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, { method: 'GET', headers })
    if (!response.ok) {
      throw new Error(`[form-schema] Repository options fetch failed for "${source.class}.${source.method}" — ${url} (${response.status})`)
    }

    const data = await response.json() as Record<string, unknown>[]
    return normalizeApiResponse(data, source.value_key, source.label_key)
  }

  buildLazyOutput(source: RawOptionsSource, config: ResolverExternalConfig): ResolvedOptionsSource {
    if (!config.repository) {
      throw new Error('[form-schema] resolver.repository config is required to build lazy output for type "repository"')
    }
    return {
      type: 'repository',
      url: this.buildUrl(source, config.repository),
      http_method: 'GET',
      requires_auth: true,
      connection: null,
      params: {},  // already encoded in the URL
      value_key: source.value_key ?? 'value',
      label_key: source.label_key ?? 'label',
      locale: config.locale,
    }
  }

  private buildUrl(source: RawOptionsSource, repoConfig: RepositoryConfig): string {
    const base = repoConfig.baseUrl.replace(/\/$/, '')
    const pattern = repoConfig.pathPattern

    const hasClassSlot = pattern.includes(':class')
    const hasMethodSlot = pattern.includes(':method')

    let path = pattern
    if (hasClassSlot) path = path.replace(':class', encodeURIComponent(source.class ?? ''))
    if (hasMethodSlot) path = path.replace(':method', encodeURIComponent(source.method ?? ''))

    const params = new URLSearchParams()
    if (!hasClassSlot && source.class) params.set('class', source.class)
    if (!hasMethodSlot && source.method) params.set('method', source.method)

    for (const [k, v] of Object.entries(source.params ?? {})) {
      params.set(k, String(v))
    }

    const qs = params.toString()
    return `${base}${path}${qs ? '?' + qs : ''}`
  }
}
