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
  tag: string | null
  icon: string | null
  color: string | null
  position: number
  data: Record<string, unknown>
}

export interface FieldOptionGroup {
  text: string
  options: FieldOption[]
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

// ---------------------------------------------------------------------------
// Raw YAML shapes (what's parsed before resolution)
// ---------------------------------------------------------------------------

export interface RawOptionValue {
  value: string | number
  label: string
  tag?: string | null
  icon?: string | null
  color?: string | null
  position?: number
  data?: Record<string, unknown>
}

export interface RawOptionsFile {
  tag: string
  name: string
  values: RawOptionValue[]
}

export interface RawOptionsSource {
  type: string
  tag: string
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
}
