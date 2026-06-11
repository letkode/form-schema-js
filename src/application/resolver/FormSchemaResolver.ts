import { YamlLoader } from '../loader/YamlLoader.js'
import { FormSchemaRegistry } from '../registry/FormSchemaRegistry.js'
import type {
  FormSchema,
  FormSection,
  FormGroup,
  FormField,
  FieldAttributes,
  RenderConfig,
  FieldOption,
  RawFormFile,
  RawSection,
  RawGroup,
  RawField,
} from '../../domain/types.js'

interface ResolverConfig {
  registry: FormSchemaRegistry
  baseUrl: string
}

interface ResolverState {
  locale: string
  context: string | null
  includeSections: string[] | null
  excludeSections: string[] | null
}

export class FormSchemaResolver {
  private readonly registry: FormSchemaRegistry
  private readonly baseUrl: string
  private readonly state: ResolverState

  constructor(config: ResolverConfig, state?: ResolverState) {
    this.registry = config.registry
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.state = state ?? { locale: 'en', context: null, includeSections: null, excludeSections: null }
  }

  withLocale(locale: string): FormSchemaResolver {
    return this.clone({ locale })
  }

  withContext(context: string): FormSchemaResolver {
    return this.clone({ context })
  }

  includingSections(tags: string[]): FormSchemaResolver {
    return this.clone({ includeSections: tags })
  }

  excludingSections(tags: string[]): FormSchemaResolver {
    return this.clone({ excludeSections: tags })
  }

  async resolve(formTag: string): Promise<FormSchema> {
    const raw = await YamlLoader.loadForm(this.baseUrl, formTag)
    return this.resolveForm(raw)
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

    const resolved = await Promise.all(
      filtered.map((s) => this.resolveSection(s))
    )

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

    const resolved = await Promise.all(
      filtered.map((g) => this.resolveGroup(g))
    )

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

    const resolved = await Promise.all(
      filtered.map((f) => this.resolveField(f))
    )

    return resolved.sort((a, b) => a.position - b.position)
  }

  private async resolveField(raw: RawField): Promise<FormField> {
    const fieldType = this.registry.getFieldType(raw.type)

    // Merge parameters: type defaults <- yaml overrides
    const parameters: Record<string, unknown> = {
      ...fieldType.getDefaultParameters(),
      ...(raw.parameters ?? {}),
    }

    // Merge attributes: type defaults <- yaml overrides
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

    // Apply context overrides
    if (this.state.context && attributes.actions[this.state.context]) {
      const override = attributes.actions[this.state.context]
      if (override.required !== undefined) attributes.required = override.required
      if (override.readonly !== undefined) attributes.readonly = override.readonly
    }

    // Resolve options
    const options = await this.resolveOptions(raw)

    // Validate interactions (warn on unknown, include all)
    const interactions = (raw.interactions ?? []).filter((i) => {
      if (!this.registry.hasInteraction(i.action)) {
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
      translations: raw.translations ?? {},
      interactions,
    }
  }

  private async resolveOptions(raw: RawField): Promise<FieldOption[]> {
    // Inline options defined directly in the YAML
    if (raw.options && raw.options.length > 0) {
      return raw.options.map((o, i) => ({
        value: o.value,
        text: o.label,
        tag: o.tag ?? null,
        icon: o.icon ?? null,
        color: o.color ?? null,
        position: o.position ?? i + 1,
        data: o.data ?? {},
      }))
    }

    // Options from a catalog source
    if (raw.options_source) {
      const source = this.registry.getOptionsSource(raw.options_source.type)
      if (!source) {
        console.warn(`[form-schema] Unknown options source type "${raw.options_source.type}" on field "${raw.tag}"`)
        return []
      }
      return source.resolve(raw.options_source.tag, this.baseUrl)
    }

    return []
  }

  private resolveRender(level: 'form' | 'section' | 'group', type: string, yamlMetadata?: Record<string, unknown>): RenderConfig {
    const def =
      level === 'form' ? this.registry.getFormRender(type) :
      level === 'section' ? this.registry.getSectionRender(type) :
      this.registry.getGroupRender(type)

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

  private clone(patch: Partial<ResolverState>): FormSchemaResolver {
    return new FormSchemaResolver(
      { registry: this.registry, baseUrl: this.baseUrl },
      { ...this.state, ...patch },
    )
  }
}
