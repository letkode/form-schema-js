import { YamlLoader } from '../loader/YamlLoader.js'
import { FormSchemaRegistry } from '../registry/FormSchemaRegistry.js'
import { mergeRawForm } from '../merger/RawFormMerger.js'
import type {
  FormSchema,
  FormFieldMap,
  FormSection,
  FormGroup,
  FormField,
  FieldAttributes,
  RenderConfig,
  FieldOption,
  ResolvedOptionsSource,
  RawFormFile,
  RawSection,
  RawGroup,
  RawField,
  ApiInternalConfig,
  ConnectionConfig,
  ResolverExternalConfig,
} from '../../domain/types.js'

export interface ResolverConfig {
  registry: FormSchemaRegistry
  /** Base URL where YAML files are served from (e.g. '/resources/form-schema') */
  baseUrl: string
  /** Config for options_source type "api_internal" (internal backend calls) */
  apiInternal?: ApiInternalConfig
  /** Named external API connections for options_source type "api_external" */
  connections?: Record<string, ConnectionConfig>
}

interface ResolverState {
  locale: string
  context: string | null
  scope: string | null
  includeSections: string[] | null
  excludeSections: string[] | null
}

export class FormSchemaResolver {
  private readonly config: ResolverConfig
  private readonly state: ResolverState

  constructor(config: ResolverConfig, state?: ResolverState) {
    this.config = { ...config, baseUrl: config.baseUrl.replace(/\/$/, '') }
    this.state = state ?? { locale: 'en', context: null, scope: null, includeSections: null, excludeSections: null }
  }

  withLocale(locale: string): FormSchemaResolver {
    return this.clone({ locale })
  }

  withContext(context: string): FormSchemaResolver {
    return this.clone({ context })
  }

  /**
   * Opts into scope-based overlay resolution. When set, `resolve()` additionally
   * attempts to load `{tag}.{scope}.yaml` and deep-merges it onto the base file by
   * matching `tag` at each level (sections → groups → fields). A missing overlay
   * file (404) is not an error — the base form resolves unchanged. Never calling
   * `withScope()` skips the overlay fetch entirely (identical to pre-1.2 behavior).
   */
  withScope(scope: string): FormSchemaResolver {
    return this.clone({ scope })
  }

  includingSections(tags: string[]): FormSchemaResolver {
    return this.clone({ includeSections: tags })
  }

  excludingSections(tags: string[]): FormSchemaResolver {
    return this.clone({ excludeSections: tags })
  }

  async resolve(formTag: string): Promise<FormSchema> {
    const raw = await this.loadWithInheritance(formTag)
    if (!this.state.scope) {
      return this.resolveForm(raw)
    }
    const overlay = await YamlLoader.loadOverlay(this.config.baseUrl, formTag, this.state.scope)
    return this.resolveForm(overlay ? mergeRawForm(raw, overlay) : raw)
  }

  /**
   * Resolves a form's `extends` chain, if any, deep-merging each file onto its
   * base with the same tag-matching merge used for scope overlays (see
   * `mergeRawForm`). `chain` tracks visited tags to detect and reject cycles.
   */
  private async loadWithInheritance(formTag: string, chain: string[] = []): Promise<RawFormFile> {
    if (chain.includes(formTag)) {
      throw new Error(`[form-schema] Circular "extends" reference: ${[...chain, formTag].join(' -> ')}`)
    }

    const raw = await YamlLoader.loadForm(this.config.baseUrl, formTag)
    if (!raw.extends) return raw

    const base = await this.loadWithInheritance(raw.extends, [...chain, formTag])
    return mergeRawForm(base, raw)
  }

  async resolveFieldMap(formTag: string): Promise<FormFieldMap> {
    const schema = await this.resolve(formTag)
    return this.extractFieldMap(schema)
  }

  private extractFieldMap(schema: FormSchema): FormFieldMap {
    const map: FormFieldMap = {}
    for (const section of schema.sections) {
      for (const group of section.groups) {
        this.collectFields(group.fields, map)
      }
    }
    return map
  }

  private collectFields(fields: FormField[], map: FormFieldMap): void {
    for (const field of fields) {
      map[field.tag] = field
      if (field.type === 'collector' && Array.isArray(field.parameters.fields)) {
        this.collectFields(field.parameters.fields as FormField[], map)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private resolution pipeline
  // -------------------------------------------------------------------------

  private async resolveForm(raw: RawFormFile): Promise<FormSchema> {
    const formRender = this.resolveRender('form', raw.render?.type ?? 'default', raw.render?.metadata)
    const sections = await this.resolveSections(raw.sections ?? [])
    const t = this.getTranslation(raw.translations)

    return {
      id: raw.id ?? raw.tag,
      name: t.name ?? raw.name,
      tag: raw.tag,
      locale: this.state.locale,
      default_locale: raw.default_locale ?? 'en',
      enabled: raw.enabled ?? true,
      parameters: raw.parameters ?? {},
      render: formRender,
      translations: raw.translations ?? {},
      sections,
    }
  }

  private async resolveSections(rawSections: RawSection[]): Promise<FormSection[]> {
    const filtered = rawSections.filter((s) => {
      if (!(s.enabled ?? true)) return false
      if (this.state.includeSections && !this.state.includeSections.includes(s.tag)) return false
      if (this.state.excludeSections?.includes(s.tag)) return false
      return true
    })

    const resolved = await Promise.all(filtered.map((s) => this.resolveSection(s)))
    return resolved.sort((a, b) => a.position - b.position)
  }

  private async resolveSection(raw: RawSection): Promise<FormSection> {
    const render = this.resolveRender('section', raw.render?.type ?? 'default', raw.render?.metadata)
    const groups = await this.resolveGroups(raw.groups ?? [])
    const t = this.getTranslation(raw.translations)

    return {
      id: raw.id ?? raw.tag,
      name: t.name ?? raw.name,
      tag: raw.tag,
      description: t.description ?? raw.description ?? null,
      position: raw.position ?? 1,
      enabled: raw.enabled ?? true,
      parameters: raw.parameters ?? {},
      render,
      translations: raw.translations ?? {},
      groups,
    }
  }

  private async resolveGroups(rawGroups: RawGroup[]): Promise<FormGroup[]> {
    const filtered = rawGroups.filter((g) => g.enabled ?? true)
    const resolved = await Promise.all(filtered.map((g) => this.resolveGroup(g)))
    return resolved.sort((a, b) => a.position - b.position)
  }

  private async resolveGroup(raw: RawGroup): Promise<FormGroup> {
    const render = this.resolveRender('group', raw.render?.type ?? 'default', raw.render?.metadata)
    const fields = await this.resolveFields(raw.fields ?? [])
    const t = this.getTranslation(raw.translations)

    return {
      id: raw.id ?? raw.tag,
      name: t.name ?? raw.name,
      tag: raw.tag,
      description: t.description ?? raw.description ?? null,
      position: raw.position ?? 1,
      enabled: raw.enabled ?? true,
      parameters: raw.parameters ?? {},
      render,
      translations: raw.translations ?? {},
      fields,
    }
  }

  private async resolveFields(rawFields: RawField[]): Promise<FormField[]> {
    const filtered = rawFields.filter((f) => f.enabled ?? true)
    const resolved = await Promise.all(filtered.map((f) => this.resolveField(f)))
    return resolved.sort((a, b) => a.position - b.position)
  }

  private async resolveField(raw: RawField): Promise<FormField> {
    const fieldType = this.config.registry.getFieldType(raw.type)

    const parameters: Record<string, unknown> = {
      ...fieldType.getDefaultParameters(),
      ...(raw.parameters ?? {}),
    }

    if (raw.type === 'collector' && Array.isArray(raw.parameters?.fields)) {
      parameters.fields = await this.resolveFields(raw.parameters.fields as RawField[])
    }

    const typeAttrDefaults = fieldType.getDefaultAttributes()
    const yamlAttrs = raw.attributes ?? {}

    const attributes: FieldAttributes = {
      required: yamlAttrs.required ?? typeAttrDefaults.required ?? false,
      readonly: yamlAttrs.readonly ?? typeAttrDefaults.readonly ?? false,
      unique: {
        enabled: yamlAttrs.unique?.enabled ?? false,
        entity: yamlAttrs.unique?.entity ?? null,
        method: yamlAttrs.unique?.method ?? null,
      },
      filter: {
        enabled: yamlAttrs.filter?.enabled ?? false,
        key: yamlAttrs.filter?.key ?? null,
      },
      actions: yamlAttrs.actions ?? {},
    }

    if (this.state.context && attributes.actions[this.state.context]) {
      const override = attributes.actions[this.state.context]
      if (override.required !== undefined) attributes.required = override.required
      if (override.readonly !== undefined) attributes.readonly = override.readonly
    }

    const { options, options_source } = await this.resolveOptions(raw)

    const interactions = (raw.interactions ?? []).filter((i) => {
      if (!this.config.registry.hasInteraction(i.action)) {
        console.warn(`[form-schema] Unknown interaction action "${i.action}" on field "${raw.tag}"`)
        return false
      }
      return true
    })

    const t = this.getTranslation(raw.translations)

    return {
      id: raw.id ?? raw.tag,
      name: t.name ?? raw.name,
      tag: raw.tag,
      type: raw.type,
      description: t.description ?? raw.description ?? null,
      attributes,
      parameters,
      position: raw.position ?? 1,
      enabled: raw.enabled ?? true,
      placeholder: t.placeholder ?? raw.placeholder ?? null,
      default_value: fieldType.formatDefaultValue(raw.default_value),
      style: raw.style ?? [],
      options,
      options_source,
      translations: raw.translations ?? {},
      interactions,
    }
  }

  private async resolveOptions(
    raw: RawField,
  ): Promise<{ options: FieldOption[]; options_source: ResolvedOptionsSource | null }> {
    // Inline options — always pre-loaded
    if (raw.options && raw.options.length > 0) {
      return {
        options: raw.options.map((o, i) => {
          const t = o.translations?.[this.state.locale] ?? {}
          return {
            value: o.value,
            label: t.label ?? o.label,
            description: t.description ?? o.description ?? null,
            tag: o.tag ?? null,
            icon: o.icon ?? null,
            color: o.color ?? null,
            position: o.position ?? i + 1,
            data: o.data ?? {},
            translations: this.normalizeOptionTranslations(o.translations),
          }
        }),
        options_source: null,
      }
    }

    if (!raw.options_source) {
      return { options: [], options_source: null }
    }

    const source = this.config.registry.getOptionsSource(raw.options_source.type)
    if (!source) {
      console.warn(`[form-schema] Unknown options source type "${raw.options_source.type}" on field "${raw.tag}"`)
      return { options: [], options_source: null }
    }

    const externalConfig: ResolverExternalConfig = {
      yamlBaseUrl: this.config.baseUrl,
      locale: this.state.locale,
      apiInternal: this.config.apiInternal,
      connections: this.config.connections,
    }

    const shouldPreLoad = source.isAlwaysPreLoad() || (raw.options_source.pre_load === true)

    if (shouldPreLoad) {
      const options = await source.resolve(raw.options_source, externalConfig)
      return { options, options_source: null }
    }

    // Deferred — build the lazy descriptor for the renderer
    if (!source.buildLazyOutput) {
      console.warn(`[form-schema] Source "${raw.options_source.type}" does not support lazy loading. Falling back to pre-load.`)
      const options = await source.resolve(raw.options_source, externalConfig)
      return { options, options_source: null }
    }

    return {
      options: [],
      options_source: source.buildLazyOutput(raw.options_source, externalConfig),
    }
  }

  private resolveRender(
    level: 'form' | 'section' | 'group',
    type: string,
    yamlMetadata?: Record<string, unknown>,
  ): RenderConfig {
    const def =
      level === 'form' ? this.config.registry.getFormRender(type) :
      level === 'section' ? this.config.registry.getSectionRender(type) :
      this.config.registry.getGroupRender(type)

    const defaultMeta = def?.getDefaultMetadata() ?? {}
    return {
      type,
      metadata: { ...defaultMeta, ...(yamlMetadata ?? {}) },
    }
  }

  private getTranslation(
    translations: Record<string, Partial<{ name: string; description: string; placeholder: string }>> | undefined,
  ): Partial<{ name: string; description: string; placeholder: string }> {
    if (!translations || !this.state.locale) return {}
    return translations[this.state.locale] ?? {}
  }

  private normalizeOptionTranslations(
    raw: Record<string, Partial<{ label: string; description: string }>> | undefined,
  ): Record<string, Partial<{ label: string; description: string }>> {
    if (!raw) return {}
    return Object.fromEntries(
      Object.entries(raw).map(([locale, t]) => {
        const entry: Partial<{ label: string; description: string }> = {}
        if (t.label !== undefined) entry.label = t.label
        if (t.description !== undefined) entry.description = t.description
        return [locale, entry]
      }),
    )
  }

  private clone(patch: Partial<ResolverState>): FormSchemaResolver {
    return new FormSchemaResolver(this.config, { ...this.state, ...patch })
  }
}
