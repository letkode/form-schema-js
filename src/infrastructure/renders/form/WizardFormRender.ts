import { AbstractRender } from '../RenderDefinition.js'

export class WizardFormRender extends AbstractRender {
  getName() { return 'wizard' }
  override getDefaultMetadata() {
    return {
      orientation: 'horizontal',
      show_progress: true,
      allow_skip: false,
      persist_on_navigate: false,
    }
  }
}
