const {beautify} = require('.');
const file = process.argv[2];
console.log(beautify(file));