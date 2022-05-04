const WebSocket = require('ws');
const constants = require("./constants");

const guardServerWSConfig = {
    isConnect: false,
    inProcessing: false,
    connect: new WebSocket.Server({ port: constants.guard.port, host: constants.host, path: constants.guard.path }),
    guardError: {
        inProcessing: 'Контроллер еще не обработал предыдущие изменения. Изменения сохранены в базе и будут приняты в течении 10 минут. Если в течение 30 минут нет изменений, обратитесь в ваш отдел IT.',
        isConnect: 'Нет соединения с контроллером. Сохранено в базе. Изменения будут приняты при восстановлении связи. Если в течение 30 минут нет изменений, обратитесь в ваш отдел IT.'
    }
}

module.exports = guardServerWSConfig;