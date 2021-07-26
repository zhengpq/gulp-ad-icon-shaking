# gulp-ad-icon-shaking

adui 小程序端组件库用于 icon tree shaking 的 gulp 插件

## 安装

```shell
npm install gulp-ad-icon-shaking
```

## 参数

- paths，`Array<string>`
- iconsExtra, `Array<string>`

## 使用注意事项

这个插件的作用原理是通过解析 wxml 文件的语法树确定使用了哪些 icon，然后对编译过后的组件库中的 icon-backgrounds.js 文件进行数据的覆盖，在使用的时候有一些点需要注意：

- 组件名请以`ad-`开头并且每个单词之间以 `-` 隔开并且小写，比如 `checkboxGroup` 组件引入时请命名成 `ad-checkbox-group`
- icon 名别用变量，因为使用变量的话没有办法识别出用的是哪个 icon，如果一定要使用变量，可以给插件传入 `iconsExtra` 参数，参数里面可以传入可能会用到的 icon 名字，编译的时候会把这些 icon 都编译进去
- 支持三元判断的写法
- 开发模式下请监听 `wml` 文件的变更，只有这样才能实时编译查看变化
- 插件所在的任务请放在最后，因为最终会修改的是 js 文件，没有办法百分百保证插件修改文件后不会被js文件相关的任务覆盖
- 因为这个插件需要遍历全部的 wxml 文件，所以在使用这个插件的任务中不要使用 change 或者是 newer 这类只监听部分文件的插件

## 使用范例

```javascript
const path = require('path')
const { src, dest, series } = require('gulp')
const aduiIconShaking = require('gulp-ad-icon-shaking');

const iconConfig = {
  paths:[path.relative(__dirname,'./dist/adui-wxapp/lib/components/common/icon/icon-backgrounds.js')], // 必填，编译后的 icon 数据文件的地址，建议填写绝对地址
  iconsExtra: [] // 选填
}

function buildTs() {
  // 代码省略
}

function buildIcon() {
  return src('src/**/*.wxml').pipe(aduiIconShaking(iconConfig.paths, iconConfig.iconsExtra)).pipe(dest('dist'))
},

exports.default = series(
  buildTs,
  buildIcon
)
```


