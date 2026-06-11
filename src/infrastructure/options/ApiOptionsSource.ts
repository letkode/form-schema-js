import { normalizeApiResponse } from '../../utils/normalizeApiResponse.js'
import type {
  FieldOption,
  RawOptionsSource,
  ResolvedOptionsSource,
  ResolverExternalConfig,
  ConnectionConfig,
} from '../../domain/types.js'
import type { OptionsSourceDefinition } from './YamlCatalogSource.js'

export class ApiOptionsSource implements OptionsSourceDefinition {
  getType() { return 'api' }
  isAlwaysPreLoad() { return false }

  async resolve(source: RawOptionsSource, config: ResolverExternalConfig): Promise<FieldOption[]> {
    const { url, headers } = this.buildRequest(source, config)
    const fullUrl = this.appendParams(url, source.params)
    const method = source.http_method ?? 'GET'

    const response = await fetch(fullUrl, { method, headers })
    if (!response.ok) {
      throw new Error(`[form-schema] API options fetch failed — ${fullUrl} (${response.status})`)
    }

    const data = await response.json() as Record<string, unknown>[]
    return normalizeApiResponse(data, source.value_key, source.label_key)
  }

  buildLazyOutput(source: RawOptionsSource, config: ResolverExternalConfig): ResolvedOptionsSource {
    const { url } = this.buildRequest(source, config)
    return {
      type: 'api',
      url,
      http_method: source.http_method ?? 'GET',
      requires_auth: false,
      connection: source.connection ?? null,
      params: source.params ?? {},
      value_key: source.value_key ?? 'value',
      label_key: source.label_key ?? 'label',
    }
  }

  private buildRequest(
    source: RawOptionsSource,
    config: ResolverExternalConfig,
  ): { url: string; headers: Record<string, string> } {
    const connectionName = source.connection
    if (!connectionName) {
      throw new Error(`[form-schema] options_source type "api" requires a "connection" name`)
    }

    const connection: ConnectionConfig | undefined = config.connections?.[connectionName]
    if (!connection) {
      throw new Error(`[form-schema] Connection "${connectionName}" is not defined in the resolver config`)
    }

    const base = connection.baseUrl.replace(/\/$/, '')
    const path = source.endpoint?.startsWith('/') ? source.endpoint : `/${source.endpoint ?? ''}`

    return {
      url: `${base}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...(connection.headers ?? {}),
      },
    }
  }

  private appendParams(url: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) return url
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString()
    return `${url}?${qs}`
  }
}
