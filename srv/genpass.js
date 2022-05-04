let bc = require('bcryptjs')

let genpass = async (pass) => {
    return await bc.hash(pass,10).then(pass=>{
        console.log(pass)
    })
}

console.log(genpass('1234'))