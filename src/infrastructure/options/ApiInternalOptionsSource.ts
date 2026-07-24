import { normalizeApiResponse } from '../../utils/normalizeApiResponse.js'
import type {
  FieldOption,
  RawOptionsSource,
  ResolvedOptionsSource,
  ResolverExternalConfig,
  ApiInternalConfig,
} from '../../domain/types.js'
import type { OptionsSourceDefinition } from './YamlCatalogSource.js'

export class ApiInternalOptionsSource implements OptionsSourceDefinition {
  getType() { return 'api_internal' }
  isAlwaysPreLoad() { return false }

  async resolve(source: RawOptionsSource, config: ResolverExternalConfig): Promise<FieldOption[]> {
    if (!config.apiInternal) {
      throw new Error('[form-schema] resolver.apiInternal config is required to use options_source type "api_internal"')
    }
    const url = this.buildUrl(source, config.apiInternal, source.method)
    const token = config.apiInternal.getToken?.()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.apiInternal.getHeaders?.() ?? {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, { method: 'GET', headers })
    if (!response.ok) {
      throw new Error(`[form-schema] Internal API options fetch failed for "${source.class}.${source.method}" — ${url} (${response.status})`)
    }

    const data = await response.json() as Record<string, unknown>[]
    return normalizeApiResponse(data, source.value_key, source.label_key, source.description_key)
  }

  buildLazyOutput(source: RawOptionsSource, config: ResolverExternalConfig): ResolvedOptionsSource {
    if (!config.apiInternal) {
      throw new Error('[form-schema] resolver.apiInternal config is required to build lazy output for type "api_internal"')
    }
    return {
      type: 'api_internal',
      url: this.buildUrl(source, config.apiInternal, source.method),
      http_method: 'GET',
      requires_auth: true,
      connection: null,
      params: {},
      value_key: source.value_key ?? 'value',
      label_key: source.label_key ?? 'label',
      description_key: source.description_key ?? 'description',
      locale: config.locale,
      filterBySearch: source.filter_by_search === true,
      searchParam: source.search_param ?? 'search',
      initUrl: source.method_init
        ? this.buildUrl(source, config.apiInternal, source.method_init)
        : null,
      keyOptionsInit: source.key_options_init ?? 'id',
    }
  }

  private buildUrl(source: RawOptionsSource, apiInternalConfig: ApiInternalConfig, method: string | undefined): string {
    const base = apiInternalConfig.baseUrl.replace(/\/$/, '')
    const pattern = apiInternalConfig.pathPattern

    const hasProviderSlot = pattern.includes(':provider')
    const hasClassSlot = pattern.includes(':class')
    const hasMethodSlot = pattern.includes(':method')

    let path = pattern
    if (hasProviderSlot) path = path.replace(':provider', encodeURIComponent(source.provider ?? ''))
    if (hasClassSlot) path = path.replace(':class', encodeURIComponent(source.class ?? ''))
    if (hasMethodSlot) path = path.replace(':method', encodeURIComponent(method ?? ''))

    const params = new URLSearchParams()
    if (!hasClassSlot && source.class) params.set('class', source.class)
    if (!hasMethodSlot && method) params.set('method', method)

    for (const [k, v] of Object.entries(source.params ?? {})) {
      params.set(k, String(v))
    }

    const qs = params.toString()
    return `${base}${path}${qs ? '?' + qs : ''}`
  }
}
