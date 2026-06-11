import { ALL_FIELD_TYPES } from '../../infrastructure/field-types/index.js'
import { ALL_FORM_RENDERS } from '../../infrastructure/renders/form/index.js'
import { ALL_SECTION_RENDERS } from '../../infrastructure/renders/section/index.js'
import { ALL_GROUP_RENDERS } from '../../infrastructure/renders/group/index.js'
import { ALL_INTERACTION_HANDLERS } from '../../infrastructure/interactions/index.js'
import { ALL_OPTIONS_SOURCES } from '../../infrastructure/options/index.js'
import type { FieldTypeDefinition } from '../../infrastructure/field-types/index.js'
import type { RenderDefinition } from '../../infrastructure/renders/RenderDefinition.js'
import type { InteractionHandlerDefinition } from '../../infrastructure/interactions/index.js'
import type { OptionsSourceDefinition } from '../../infrastructure/options/index.js'

export class FormSchemaRegistry {
  private readonly fieldTypes = new Map<string, FieldTypeDefinition>()
  private readonly formRenders = new Map<string, RenderDefinition>()
  private readonly sectionRenders = new Map<string, RenderDefinition>()
  private readonly groupRenders = new Map<string, RenderDefinition>()
  private readonly interactions = new Map<string, InteractionHandlerDefinition>()
  private readonly optionsSources = new Map<string, OptionsSourceDefinition>()

  constructor() {
    ALL_FIELD_TYPES.forEach((ft) => this.fieldTypes.set(ft.getName(), ft))
    ALL_FORM_RENDERS.forEach((r) => this.formRenders.set(r.getName(), r))
    ALL_SECTION_RENDERS.forEach((r) => this.sectionRenders.set(r.getName(), r))
    ALL_GROUP_RENDERS.forEach((r) => this.groupRenders.set(r.getName(), r))
    ALL_INTERACTION_HANDLERS.forEach((h) => this.interactions.set(h.getName(), h))
    ALL_OPTIONS_SOURCES.forEach((s) => this.optionsSources.set(s.getType(), s))
  }

  registerFieldType(def: FieldTypeDefinition): this {
    this.fieldTypes.set(def.getName(), def)
    return this
  }

  registerFormRender(def: RenderDefinition): this {
    this.formRenders.set(def.getName(), def)
    return this
  }

  registerSectionRender(def: RenderDefinition): this {
    this.sectionRenders.set(def.getName(), def)
    return this
  }

  registerGroupRender(def: RenderDefinition): this {
    this.groupRenders.set(def.getName(), def)
    return this
  }

  registerInteractionHandler(def: InteractionHandlerDefinition): this {
    this.interactions.set(def.getName(), def)
    return this
  }

  registerOptionsSource(def: OptionsSourceDefinition): this {
    this.optionsSources.set(def.getType(), def)
    return this
  }

  getFieldType(name: string): FieldTypeDefinition {
    const ft = this.fieldTypes.get(name)
    if (!ft) throw new UnknownFieldTypeError(name, [...this.fieldTypes.keys()])
    return ft
  }

  getFormRender(name: string): RenderDefinition | undefined {
    return this.formRenders.get(name)
  }

  getSectionRender(name: string): RenderDefinition | undefined {
    return this.sectionRenders.get(name)
  }

  getGroupRender(name: string): RenderDefinition | undefined {
    return this.groupRenders.get(name)
  }

  hasInteraction(name: string): boolean {
    return this.interactions.has(name)
  }

  getOptionsSource(type: string): OptionsSourceDefinition | undefined {
    return this.optionsSources.get(type)
  }
}

export class UnknownFieldTypeError extends Error {
  constructor(name: string, known: string[]) {
    super(`[form-schema] Unknown field type "${name}". Known types: ${known.join(', ')}`)
    this.name = 'UnknownFieldTypeError'
  }
}
