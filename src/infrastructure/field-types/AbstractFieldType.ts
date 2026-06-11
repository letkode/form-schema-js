import type { FieldType, RawFieldAttributes } from '../../domain/types.js'

export interface FieldTypeDefinition {
  getName(): FieldType
  takesOptions(): boolean
  getDefaultParameters(): Record<string, unknown>
  getDefaultAttributes(): RawFieldAttributes
  formatDefaultValue(value: unknown): unknown
}

export abstract class AbstractFieldType implements FieldTypeDefinition {
  abstract getName(): FieldType
  abstract takesOptions(): boolean
  abstract getDefaultParameters(): Record<string, unknown>

  getDefaultAttributes(): RawFieldAttributes {
    return { required: false, readonly: false }
  }

  formatDefaultValue(value: unknown): unknown {
    return value ?? null
  }
}
