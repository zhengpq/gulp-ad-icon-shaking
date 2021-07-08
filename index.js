const jsParser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { dataURIData } = require('adui-icon').default
const fs = require('fs')
const htmlparser2 = require('htmlparser2')
const through = require('through2')

// 默认一定会使用的 icon
const iconsDefault = [
  'person',
  'image-outlined',
  'alert-circle',
  'arrow-right',
  'tick',
  'arrow-down',
  'add',
  'tick-circle-outlined',
  'warning-circle-outlined',
  'alert-circle-outlined',
  'info-circle-outlined',
  'search',
  'cancel-circle',
  'triangle-up',
  'triangle-down',
  'cancel',
  'minus',
  'add',
]

// 使用了 icon 组件的组件
const componentHasIconProps = {
  'ad-avatar': ['placeholderIcon'],
  'ad-button': ['leftIcon', 'rightIcon'],
  'ad-cell': ['leftIcon', 'errorIcon', 'rightIcon'],
  'ad-floating-button': ['icon'],
  'ad-grid-item': ['icon'],
  'ad-input': ['icon', 'errorIcon'],
  'ad-message': ['leftIconDefault', 'leftIcon', 'rightIcon'],
  'ad-picture': ['placeholder', 'failedIcon'],
  'ad-sheet': ['titleIcon'],
  'ad-steps-item': ['icon'],
  'ad-tab-bar-item': ['icon'],
  'ad-tag': ['leftIcon', 'rightIcon'],
  'ad-toast': ['icon'],
  'ad-upload-image': ['icon'],
}

// prop 名称大写字母变成小写字母
Object.keys(componentHasIconProps).forEach((key) => {
  componentHasIconProps[key] = componentHasIconProps[key].map((item) => item.toLowerCase())
})

const getIconData = (atrValue) => {
  // 如果是字符串且 icon 库里面包含这个 icon，直接返回 icon 数据
  if (dataURIData[atrValue.trim()] !== undefined) {
    return {
      [atrValue]: dataURIData[atrValue],
    }
  }
  // 除了直接获取的情况外，只处理三元判断的情况
  const ast = jsParser.parse(atrValue, { plugins: ['jsx', 'flow'] })
  const data = {}
  traverse(ast, {
    ConditionalExpression(nodePath) {
      if (nodePath.node.consequent.type === 'StringLiteral') {
        data[nodePath.node.consequent.value] =
          dataURIData[nodePath.node.consequent.value]
      }
      if (nodePath.node.alternate.type === 'StringLiteral') {
        data[nodePath.node.alternate.value] =
          dataURIData[nodePath.node.alternate.value]
      }
    },
  })
  return data
}

module.exports = (paths, iconsExtra) => {
  // 文件最终的内容
  let fileContent = {}
  // 初始化必须的 icon 内容
  iconsDefault.forEach((item) => {
    fileContent[item] = dataURIData[item]
  })
  return through.obj(
    { defaultEncoding: 'utf8' },
    (file, encoding, callback) => {
      // 只处理 wxml 文件
      if (file.relative.includes('.wxml')) {
        const htmlParser = new htmlparser2.Parser({
          onopentag(name, attributes) {
            // 如果元素是 ad-icon, 直接处理 icon 属性
            if (name === 'ad-icon') {
              const { icon } = attributes
              const data = getIconData(icon)
              fileContent = { ...fileContent, ...data }
            } else if (componentHasIconProps[name] !== undefined) {
              // console.log('pakizheng', name, attributes)
              // 除了 ad-icon 之外，只匹配 prop 中有用到 icon 的组件
              Object.keys(attributes).forEach((item) => {
                if (componentHasIconProps[name].includes(item)) {
                  const data = getIconData(attributes[item])
                  fileContent = { ...fileContent, ...data }
                }
              })
            }
          },
        })
        htmlParser.write(file.contents)
        htmlParser.end()
        // 额外的的 icon 配置
        if (iconsExtra) {
          const iconsExtraData = {}
          iconsExtra.forEach((item) => {
            iconsExtraData[item] = dataURIData[item]
          })
          fileContent = { ...fileContent, ...iconsExtraData }
          Object.assign(fileContent, iconsExtraData)
        }
        const contents = `export default ${JSON.stringify(fileContent)}`
        paths.forEach((item) => {
          fs.writeFileSync(item, contents, 'utf-8')
        })
      }
      callback()
    }
  )
}
