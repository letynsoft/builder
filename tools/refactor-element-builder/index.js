'use strict'

let swig = require('swig')
let config = require('./settings')
let path = require('path')
let fs = require('fs')

let elementDir = ''
let getElements = () => {
  let elementPath = path.join(config.publicDir, config.elementsPath)
  console.log(elementPath)
  let files = fs.readdirSync(elementPath)
  let elements = []
  files.forEach((element) => {
    let filePath = path.join(elementPath, element)
    let stats = fs.lstatSync(filePath)
    let isDirectory = stats.isDirectory()
    if (isDirectory && element[ 0 ] !== '_') {
      elements.push(element)
    }
  })
  console.log(elements)
  return elements
}

let collectPublicJsFile = (contentPath, files, prefix) => {
  fs.existsSync(contentPath) && fs.readdirSync(contentPath).forEach((file) => {
    let subPath = path.resolve(contentPath, file)
    if (fs.lstatSync(subPath).isDirectory()) {
      collectPublicJsFile(subPath, files, prefix + '/' + file)
    } else if (subPath.match(/\.js$/)) {
      files.push(prefix + '/' + file)
    }
  })
  return files
}

let outputPhpElementSettings = (settings, element) => {
  let thumbnailImage = settings.metaThumbnail && settings.metaThumbnail.value ? `'metaThumbnailUrl' => $urlHelper->to(
                // @codingStandardsIgnoreLine
                  'public/sources/newElements/${element}/${element}/public/${settings.metaThumbnail.value}'
                ),` : ''
  let previewImage = settings.metaPreview && settings.metaPreview.value ? `'metaPreviewUrl' => $urlHelper->to(
                // @codingStandardsIgnoreLine
                    'public/sources/newElements/${element}/${element}/public/${settings.metaPreview.value}'
                ),` : ''
  console.log(
    `
        '${element}' => [
            'bundlePath' => $urlHelper->to(
                'public/sources/newElements/${element}/public/dist/element.bundle.js'
            ),
            'elementPath' => $urlHelper->to(
                'public/sources/newElements/${element}/${element}/'
            ),
            'assetsPath' => $urlHelper->to(
                'public/sources/newElements/${element}/${element}/public/'
            ),
            'settings' => [
                'name' => '${settings.name.value}',
                ${thumbnailImage}
                ${previewImage}
                'metaDescription' => '${settings.metaDescription ? settings.metaDescription.value : ''}',
            ],
        ],
    `
  )
}
let updateSettings = (settings, element) => {
  // generate settings tag
  settings.tag = {
    access: 'protected',
    type: 'string',
    value: element
  }
  // Public javascript
  let publicJs = collectPublicJsFile(path.resolve(elementDir, 'public/js'), [], config.elementsDirName + '/' + element + '/public/js')
  if (publicJs.length) {
    settings.metaPublicJs = {
      access: 'protected',
      type: 'string',
      value: publicJs
    }
  }

  return settings
}

let getCssSettings = (elementDirectory) => {
  // Css settings
  let cssFile = path.resolve(elementDirectory, 'styles.css')
  let cssRelativeFile = fs.existsSync(cssFile) ? "require( 'raw-loader!./styles.css' )" : false
  // editor file
  let editorCssFile = path.resolve(elementDirectory, 'editor.css')
  let editorCssString = fs.existsSync(editorCssFile) ? "require( 'raw-loader!./styles.css')" : false

  // mixins
  let mixinsDir = path.resolve(elementDirectory, 'cssMixins')
  let cssMixins = {}
  fs.existsSync(mixinsDir) && fs.readdirSync(mixinsDir).forEach((file) => {
    let filePath = path.resolve(mixinsDir, file)
    if (!fs.lstatSync(filePath).isDirectory()) {
      cssMixins[ path.basename(filePath, path.extname(filePath)) ] = {
        mixin: fs.readFileSync(filePath, 'utf8')
      }
    }
  })

  // Settings
  let cssSettings = {}
  // file
  cssSettings.css = cssRelativeFile
  cssSettings.editorCss = editorCssString
  // mixins
  if (Object.keys(cssMixins).length) {
    cssSettings.mixins = cssMixins
  }

  return cssSettings
}

let renderTemplate = (data) => {
  return swig.renderFile(path.join(__dirname, 'index-template.jst'), data)
}

let processElement = (element) => {
  console.log('============================')
  console.log('Element: ', element)
  let elementDirectory = path.join(config.publicDir, config.elementsPath, element)

  let settingsFile = path.resolve(elementDirectory, 'settings.json')
  let settingsString = fs.existsSync(settingsFile) ? fs.readFileSync(settingsFile) : '{}'
  // Update all related attributes
  let settings = JSON.parse(settingsString)
  // Update Settings
  outputPhpElementSettings(settings, element)
  settings = updateSettings(settings, element)

  let cssSettings = getCssSettings(elementDirectory)
  console.log('====      TEMPLATE      ====')
  let template = renderTemplate({
    cssSettings: () => {
      return JSON.stringify(cssSettings)
    },
    elementComponentName: () => {
      // Ucfirst
      return element.charAt(0).toUpperCase() + element.slice(1)
    }
  })

  console.log(template)
  console.log('=============================')
  // var componentTemplateFile = path.resolve(elementDir, 'component.js')
  // var componentTemplate = ''
  // if (fs.existsSync(componentTemplateFile)) {
  //   componentTemplate = fs.readFileSync(componentTemplateFile)
  // }
  //
  // fs.writeFileSync(path.join(elementDir, 'element.js'), template)
}

let elements = getElements()
elements.forEach((element) => {
  let elementDirectory = path.join(config.publicDir, config.elementsPath, element)
  fs.lstat(elementDirectory, (err, stats) => {
    if (!err && stats.isDirectory()) {
      processElement(element)
    }
  })
})
