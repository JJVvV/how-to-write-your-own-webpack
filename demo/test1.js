/**
 * 代码分割，懒加载
 */

console.log('test1!!')
let testConfig2 = require('./test2.js')
module.exports = {
    age: testConfig2.age,
    name: 'hehe'
}