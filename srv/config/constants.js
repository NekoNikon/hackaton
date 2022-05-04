const fs = require('fs');
const path = require("path");
const ini = require('ini');
const process = require('process');
//console.log(path.dirname(process.execPath));
let config = ini.parse(fs.readFileSync(path.dirname(process.execPath)+'/sd-config.ini', 'utf-8'));
fs.close;

//получение хоста из конф файла ura
//let fileContent = fs.readFileSync("D:\\settings.txt", "utf8");
//let getIp=JSON.parse(fileContent);

const constants = {
    debug: false,
    port: 8445,
    host: config.HardSettings.Host,
    database: {
        user: 'postgres',
        password: 'jojodio',//Buffer.from("em9pdGliMjNHdmVyZGU=", 'base64').toString('ascii'),
        host: '127.0.0.1',
        port: 5432,
        database: 'agreement'
    },
    graphql: {
        path: '/graphql'
    },
    guard: {
        port: 9997,
        path: '/sd/d037b3b1d204fda81bca6cf1b3cceb50'
    },
    session: {
        table: 'sessions',
        secret: 'a4454fafd08f4b9d411167896035e682a4454fafd08f4b9d411167896035e682'
    },
	hardware: {
		useMacroscop: config.HardSettings.UseMacroscop
	}
}

module.exports = constants;