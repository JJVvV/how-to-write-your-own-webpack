let fs = require('fs')
let path = require('path')
let program = require('commander')
let modulesContent = require('./modules')




function output(entryFile, outputFile){
  entryFile = path.resolve(process.cwd(), entryFile)
  outputFile = path.resolve(process.cwd(), outputFile)
  let content = modulesContent(entryFile)
  console.log(entryFile, outputFile)
  fs.writeFile(outputFile, content, (err) => {
    if(err){
      console.error(err)
      return
    }
    console.log('写入成功！', outputFile)
  })
}


program
  .option("-e, --entry [value]", "entry file")
  .option("-o, --output <value>", "output file")
  .parse(process.argv)


output(program.entry, program.output || './bundle.js')