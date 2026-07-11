// ---------------------------------------------------------------------------
// Core field types
// ---------------------------------------------------------------------------

export type FieldType =
  | 'string'
  | 'email'
  | 'phone'
  | 'password'
  | 'textarea'
  | 'hidden'
  | 'pin'
  | 'number'
  | 'range'
  | 'date'
  | 'datetime'
  | 'date-range'
  | 'select'
  | 'select-multiple'
  | 'combobox'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'duallist'
  | 'tree'
  | 'rating'
  | 'file'
  | 'collector'

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export type InteractionTrigger = 'change' | 'blur' | 'focus'

export type InteractionAction =
  | 'toggle_visibility'
  | 'toggle_required'
  | 'set_value'
  | 'filter_options'
  | 'set_date_constraint'
  | 'compute'
  | 'ajax_validate'

export interface FieldInteraction {
  trigger: InteractionTrigger
  action: InteractionAction
  target: string | string[] | null
  condition: Record<string, unknown>
  params: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface FieldOption {
  value: string | number
  text: string
  description: string | null
  tag: string | null
  icon: string | null
  color: string | null
  position: number
  data: Record<string, unknown>
  translations: Record<string, Partial<{ text: string; description: string }>>
}

export interface FieldOptionGroup {
  text: string
  options: FieldOption[]
}

/**
 * Present on a field when options_source.pre_load is false.
 * The renderer uses this to load options lazily at mount time.
 */
export interface ResolvedOptionsSource {
  type: string
  /** Fully resolved URL — domain already applied from repository.baseUrl or connection.baseUrl */
  url: string
  http_method: string
  /** true for repository sources — renderer must send the user's JWT */
  requires_auth: boolean
  /** Connection name used (api type only) — renderer may use it to look up extra headers */
  connection: string | null
  /** Query params to append on every request */
  params: Record<string, unknown>
  /** Key in the API response object to use as option value */
  value_key: string
  /** Key in the API response object to use as option label/text */
  label_key: string
  /** Active locale — renderer may forward it to the backend (e.g. as Accept-Language or query param) */
  locale: string
}

// ---------------------------------------------------------------------------
// Field attributes
// ---------------------------------------------------------------------------

export interface UniqueRule {
  enabled: boolean
  entity: string | null
  method: string | null
}

export interface FilterRule {
  enabled: boolean
  key: string | null
}

export interface ActionOverride {
  required?: boolean
  readonly?: boolean
  enabled?: boolean
}

export interface FieldAttributes {
  required: boolean
  readonly: boolean
  unique: UniqueRule
  filter: FilterRule
  /** open-ended: developer defines context keys (create, edit, show, or any custom) */
  actions: Record<string, ActionOverride>
}

// ---------------------------------------------------------------------------
// Render definitions
// ---------------------------------------------------------------------------

export interface RenderConfig {
  type: string
  metadata: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Form structure
// ---------------------------------------------------------------------------

export interface FormField {
  id: string
  name: string
  tag: string
  type: FieldType
  description: string | null
  attributes: FieldAttributes
  parameters: Record<string, unknown>
  position: number
  enabled: boolean
  placeholder: string | null
  default_value: unknown
  style: string[]
  options: FieldOption[]
  option_groups?: FieldOptionGroup[]
  /** Populated when options_source.pre_load is false. Null when options are already inlined. */
  options_source: ResolvedOptionsSource | null
  translations: Record<string, Partial<{ name: string; placeholder: string; description: string }>>
  interactions: FieldInteraction[]
}

export interface FormGroup {
  id: string
  name: string
  tag: string
  description: string | null
  position: number
  enabled: boolean
  parameters: Record<string, unknown>
  render: RenderConfig
  translations: Record<string, Partial<{ name: string; description: string }>>
  fields: FormField[]
}

export interface FormSection {
  id: string
  name: string
  tag: string
  description: string | null
  position: number
  enabled: boolean
  parameters: Record<string, unknown>
  render: RenderConfig
  translations: Record<string, Partial<{ name: string; description: string }>>
  groups: FormGroup[]
}

export interface FormSchema {
  id: string
  name: string
  tag: string
  locale: string
  default_locale: string
  enabled: boolean
  parameters: Record<string, unknown>
  render: RenderConfig
  translations: Record<string, Partial<{ name: string; description: string }>>
  sections: FormSection[]
}

/** All fields in a form indexed by their tag. Collector sub-fields are included as top-level entries. */
export type FormFieldMap = Record<string, FormField>

// ---------------------------------------------------------------------------
// Raw YAML shapes (what's parsed before resolution)
// ---------------------------------------------------------------------------

export interface RawOptionValue {
  value: string | number
  label: string
  description?: string | null
  tag?: string | null
  icon?: string | null
  color?: string | null
  position?: number
  data?: Record<string, unknown>
  translations?: Record<string, Partial<{ label: string; description: string }>>
}

export interface RawOptionsFile {
  tag: string
  name: string
  values: RawOptionValue[]
}

export interface RawOptionsSource {
  type: string
  /** Whether to resolve options during schema loading (true) or defer to renderer (false). Default: false */
  pre_load?: boolean
  // --- catalog ---
  tag?: string
  // --- repository ---
  class?: string
  method?: string
  // --- api ---
  connection?: string
  endpoint?: string
  http_method?: string
  // --- shared (repository + api) ---
  /** Key in the API response object to use as option value. Default: 'value' */
  value_key?: string
  /** Key in the API response object to use as option label/text. Default: 'label' */
  label_key?: string
  /** Extra query params sent on every request */
  params?: Record<string, unknown>
}

export interface RawFieldAttributes {
  required?: boolean
  readonly?: boolean
  unique?: Partial<UniqueRule>
  filter?: Partial<FilterRule>
  actions?: Record<string, ActionOverride>
}

export interface RawField {
  id?: string
  tag: string
  name: string
  type: FieldType
  description?: string | null
  position?: number
  enabled?: boolean
  placeholder?: string | null
  default_value?: unknown
  style?: string[]
  attributes?: RawFieldAttributes
  parameters?: Record<string, unknown>
  options?: RawOptionValue[]
  options_source?: RawOptionsSource
  interactions?: FieldInteraction[]
  translations?: Record<string, Partial<{ name: string; placeholder: string; description: string }>>
}

export interface RawGroup {
  id?: string
  tag: string
  name: string
  description?: string | null
  position?: number
  enabled?: boolean
  parameters?: Record<string, unknown>
  render?: Partial<RenderConfig>
  translations?: Record<string, Partial<{ name: string; description: string }>>
  fields?: RawField[]
}

export interface RawSection {
  id?: string
  tag: string
  name: string
  description?: string | null
  position?: number
  enabled?: boolean
  parameters?: Record<string, unknown>
  render?: Partial<RenderConfig>
  translations?: Record<string, Partial<{ name: string; description: string }>>
  groups?: RawGroup[]
}

export interface RawFormFile {
  id?: string
  tag: string
  name: string
  enabled?: boolean
  default_locale?: string
  parameters?: Record<string, unknown>
  render?: Partial<RenderConfig>
  translations?: Record<string, Partial<{ name: string; description: string }>>
  sections?: RawSection[]
  /**
   * Tag of a base form to inherit from. When set, this file is deep-merged
   * onto the resolved base (same tag-matching merge used for scope overlays)
   * before any further resolution — a derived, explicitly-named variant of
   * another form rather than a same-tag runtime substitution. See "Form
   * inheritance" vs "Scope overlays" in the README.
   */
  extends?: string
}

// ---------------------------------------------------------------------------
// Resolver external config types (used by OptionsSourceDefinition)
// ---------------------------------------------------------------------------

export interface RepositoryConfig {
  /** Base URL of the backend (e.g. import.meta.env.VITE_API_URL) */
  baseUrl: string
  /**
   * URL path pattern for repository calls.
   * Use :class and :method as placeholders.
   * If a placeholder is absent it is sent as a query param instead.
   * Example: '/form-options/:class/:method'
   */
  pathPattern: string
  /** Returns the current user's JWT token to attach as Authorization header */
  getToken?: () => string | null
  /**
   * Returns extra headers to send on every repository request (e.g. tenant
   * schema or active-identity headers required by multi-tenant backends).
   * Called fresh on each request, so it can reflect state that changes at
   * runtime (like the active identity). Merged before `Authorization`.
   */
  getHeaders?: () => Record<string, string>
}

export interface ConnectionConfig {
  /** Base URL of the external API */
  baseUrl: string
  /** Static headers sent on every request (API keys, tokens, etc.) */
  headers?: Record<string, string>
}

export interface ResolverExternalConfig {
  yamlBaseUrl: string
  locale: string
  repository?: RepositoryConfig
  connections?: Record<string, ConnectionConfig>
}
