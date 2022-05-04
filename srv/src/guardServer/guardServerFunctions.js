const guardServerWSConfig = require("../../config/guardServerWSConfig");
const client = require("../../config/pgConfig");
//debug to file, enable only in dev mode if needed
//const {skudLogger} = require("../core/functions");
//const fs = require('fs');
//const debugFileLog=process.env.APPDATA+'\\skud.log';

const guardServerFunctions = {
    send: {
        syncCells: async () => {
            if (guardServerWSConfig.connect.clients.size !== 0) {
                const req = await client.query(`SELECT * FROM sync_cells() AS response`);
                if (req.rows.length !== 0) {
                    let action = {
                        type: 'addCard',
                        data: req.rows.map((value)=>{return value.response})
                    }
					action.data.sort((a,b) => {
					return a.network_address-b.network_address
					})
                    console.log('\033[33m%s\x1b[0m', 'DEBUG[Send keys]:', 'Keys sent to hardware:', action);
					//skudLogger(debugFileLog,action,fs);
                    guardServerWSConfig.inProcessing = true;
                    guardServerWSConfig.connect.clients.forEach((ws) => { ws.send(JSON.stringify(action)) })
                } else {
                    console.log('\033[33m%s\x1b[0m', 'DEBUG[Send keys]:', 'Empty DB cells queue. There is no keys for update to hardware.');
                }
            } else {
                    console.log('\033[33m%s\x1b[0m', 'DEBUG[Send keys]:', 'There is no hardware connected on websocket, please check and try to send keys later.');
			}
        }
    },
    message: {

    }

}

module.exports = guardServerFunctions;