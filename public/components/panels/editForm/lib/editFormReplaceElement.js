import React from 'react'
import ReplaceElement from './ReplaceElement'
import vcCake from 'vc-cake'

const hubCategoriesService = vcCake.getService('hubCategories')
const elementsStorage = vcCake.getStorage('elements')
const workspaceStorage = vcCake.getStorage('workspace')
const workspaceContentState = workspaceStorage.state('content')

export default class EditFormReplaceElement extends React.Component {
  constructor (props) {
    super(props)
    this.handleReplaceElement = this.handleReplaceElement.bind(this)
    this.openEditFormOnReplace = this.openEditFormOnReplace.bind(this)
  }

  handleReplaceElement (tag) {
    const cookElement = this.props.elementAccessPoint.cook()
    const id = this.previousElementId = cookElement.get('id')
    const editFormTabSettings = cookElement.settings('editFormTab1')
    const currentElementAttributes = [
      ...(editFormTabSettings && editFormTabSettings.settings && editFormTabSettings.settings.value),
      'parent'
    ]
    const replaceElementMergeData = {
      tag
    }
    currentElementAttributes.forEach(key => {
      replaceElementMergeData[key] = cookElement.get(key)
    })
    elementsStorage.state('elementReplace').onChange(this.openEditFormOnReplace)
    elementsStorage.trigger('replace', id, replaceElementMergeData)
  }

  openEditFormOnReplace ({ id, data }) {
    if (id === this.previousElementId) {
      elementsStorage.state('elementReplace').ignoreChange(this.openEditFormOnReplace)
      workspaceContentState.set(false)
      const settings = workspaceStorage.state('settings').get()
      if (settings && settings.action === 'edit') {
        workspaceStorage.state('settings').set(false)
      }
      workspaceStorage.trigger('edit', data.id, data.activeTab, { insertAfter: false })
    }
  }

  render () {
    const { elementAccessPoint } = this.props
    const cookElement = elementAccessPoint.cook()
    const tag = cookElement.get('tag')
    const category = hubCategoriesService.getElementCategoryName(tag) || ''
    const options = {
      category: category || '*',
      elementLabel: cookElement.get('name') || category.toLowerCase() || 'element'
    }

    const categorySettings = hubCategoriesService.get(category)
    if (!categorySettings || !categorySettings.elements || categorySettings.elements.length <= 1 || cookElement.relatedTo('RootElements') || !cookElement.relatedTo('General')) {
      return null
    }

    return (
      <div className='vcv-ui-form-group' key={`form-group-field-${cookElement.get('id')}-replaceElement`}>
        <ReplaceElement
          options={options}
          tag={tag}
          updater={this.handleReplaceElement}
          element={cookElement}
        />
      </div>
    )
  }
}
