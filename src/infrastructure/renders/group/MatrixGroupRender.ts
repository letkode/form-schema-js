import { AbstractRender } from '../RenderDefinition.js'

export class MatrixGroupRender extends AbstractRender {
  getName() { return 'matrix' }
  override getDefaultMetadata() {
    return { rows: [], cols: [] }
  }
}
