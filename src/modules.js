
let fs = require('fs')
let path = require('path')
let esprima = require('esprima')
let {REQUIRE, FUNC_MAIN_TEMPLATE} = require('./const')

function gogogo(entry, modules, id){
  let src = path.resolve(__dirname, entry)
  makeArgumentFunc(src, modules, id)
}

/**
 * 获取所有模块对象
 * @param {String} entry 
 * @return {Object}
 */
function getModulesObject(entry){
  let modules = {}
  let id = 0
  gogogo(entry, modules, id)
  return modules
}

function initModule(id, content){
  this.id = id
  this.content = content
  this.range = []
}

function makeArgumentFunc(src, modules, id){
  if(modules[src]!==undefined) return
  if(!fs.existsSync(src)) return
  
  let data = fs.readFileSync(src).toString()
  let par = esprima.parseScript(data, {
    range: true
  })
  modules[src] = new initModule(id++, data)
  
  if(par){
    par.body.forEach((item) => {
      if(item.type==='VariableDeclaration') {
        item.declarations.forEach((dec) => {
          try{
            if(dec.init['callee'].name === 'require'){
              console.log(dec.init['arguments'][0].value)
              let name = dec.init['arguments'][0].value
              name = path.resolve(path.dirname(src), name)
              modules[src].range.push({
                ra: dec.init.range,
                name: name
              })
              
              gogogo(name, modules, id)
            }
          }catch(e){
            
          }
          
        })
      }
    })
  }
}

/**
 * 
 * @param {*} modules 
 */
function formatModules(modules){
  modules = addIdToRange(modules)
  modules = formatToArray(modules)
  return modules
}
/**
 * 添加id到range对象
 * @param {Object} modules 
 */
function addIdToRange(modules){
  Object.keys(modules).forEach((key) => {
    let module = modules[key]
    if(!module.range.length) return
    module.range.forEach((ra) => {
      let name = path.resolve(__dirname, ra.name)
      if(modules[name]){
        ra.id = modules[name].id
      }
    })
  })
  return modules
}

/**
 * 根据id转换modules对象为数组
 * @param {Object} modules 
 * @return {Array} modules 
 */
function formatToArray(modules){
  modules = Object.values(modules).sort((a, b) => a.id - b.id)
  return modules.map(addWrapperToModule)
}

/**
 * 模块外层添加函数
 * @param {Object} module 
 */
function addWrapperToModule(module){
  let res = []
  let before = `(function(module, exports, ${REQUIRE}) {`
  res.push(before)
  res.push(replaceWithId(module))
  res.push(`})`)
  return res.join('\n')
}

function replaceWithId(module){
  if(!module.range.length) return module.content
  
  let content = module.range.reduce((content, range) => {
    let ra = range.ra
    return `${content.slice(0, ra[0])}${REQUIRE}(${range.id});${content.slice(ra[1])}`
  }, module.content)
  return content
}




/**
 * 绑定所有的module，输出打包后的文件内容
 * @param {Array} modules
 * @return {String} 
 */
function bundleModules(modules){
  let modulesContent = modules.map((module, index) => {
    return `
    /* ${index} */
    ${module}
    `
  }).join(',')
  
  return FUNC_MAIN_TEMPLATE.replace(/\{\{modules\}\}/, modulesContent)
}



function modulesContent(entry){
  let modules = getModulesObject(entry)
  
  modules = formatModules(modules)
  return bundleModules(modules)
}

module.exports = modulesContent