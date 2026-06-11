import { AbstractRender } from '../RenderDefinition.js'

export class StepperFormRender extends AbstractRender {
  getName() { return 'stepper' }
  override getDefaultMetadata() {
    return {
      orientation: 'horizontal',
      show_progress: true,
      allow_skip: false,
      persist_on_navigate: true,
    }
  }
}
