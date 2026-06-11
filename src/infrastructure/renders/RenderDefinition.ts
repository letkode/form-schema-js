export interface RenderDefinition {
  getName(): string
  getDefaultMetadata(): Record<string, unknown>
}

export abstract class AbstractRender implements RenderDefinition {
  abstract getName(): string
  getDefaultMetadata(): Record<string, unknown> { return {} }
}
