'use strict'
require('events').EventEmitter.prototype._maxListeners = 100;
const constants = require("./config/constants");
const fs = require('fs');
// express
const favicon = require('serve-favicon');
const express = require('express');
const path = require('path');
const session = require('express-session')

// authentication
const passport = require('passport');
const methodOverride = require('method-override');
const { initializePassport } = require('./config/passportConfig');
// DB session
const pgSession = require('connect-pg-simple')(session);
const sessionPool = require('pg').Pool;
const sessionConfig = {
    store: new pgSession({
        pool: new sessionPool({...constants.database}),
        tableName: constants.session.table
    }),
    name: 'SID',
    secret: constants.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        nameSite: true,
        secure: true
    }
}

const pg = require('pg');
const connectionString = `postgres://${constants.database.user}:${constants.database.password}@${constants.database.host}:${constants.database.port}/${constants.database.database}`;

// websocket
const WebSocket = require('ws');
const graphQLWebSocket = new WebSocket.Server({noServer: true});
// apollo
const cors = require('cors'); //ura
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
const {ApolloServer} = require('apollo-server-express');
// SSL
const certPath1 = path.join(__dirname, './SSL/key.crt');//ura
const privateKey = fs.readFileSync(certPath1);
const certPath2 = path.join(__dirname, './SSL/cert.crt');
const certificate = fs.readFileSync(certPath2);
// my
const client = require("./config/pgConfig");
//guard cfg
const sdServerWSConfig = require("./config/sdServerWSConfig");
//Apollo cfg
const typeDefs = require("./src/graphql/schema.js");
const {publish} = require("./src/graphql/graphqlFunctions");
//fucntions
const {MergeRecursiveArrayObjects} = require("./src/core/functions");
const {resolvers} = require("./src/graphql/resolvers");
const credentials = {key: privateKey, cert: certificate};
const bodyParser = require('body-parser');
const {skudLogger} = require("./src/core/functions");
//http
const https = require('https');
const multer = require('multer');
const app = express();
const httpsServer = https.createServer(credentials, app);
//const EventEmitter = require('events');
//const emitter = new EventEmitter();
//emitter.setMaxListeners(100);


let getHost="'"+constants.host+"'";
let hrReportInData;
const debugFileLog = process.env.APPDATA + '\\sd.log';
console.log(constants);


// настройка express
app.use(cors(corsOptions)); //ura
//// сессии
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
//// пределы post запросов
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
//// подгрузка favicon css js файлов
app.use(favicon(__dirname + '/build/favicon.ico'));
app.use('/static', express.static(path.join(__dirname, 'build/static')));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// проверки на авторизованность
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}


let filePgClient = new pg.Client(connectionString);
filePgClient.connect();
app.post('/api/files', (req, res, next) => {

    filePgClient.query( `SELECT id, filename, data_file FROM document_files WHERE id = ${req.body.item.id}`, (err, result) => {
        if (err) {
            return console.error('error head reply pg query:', err);
        }
        console.log("result.rows[0].id",result.rows[0].id)
        // let faceImages =  result.rows[0].data_file.replace(/data:image.png;base64,/g,'')
        // let temp = {filename:result.rows[0].filename+'.doc', type:'file_open', data:`${result.rows[0].data_file.replace('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,','')}`}
        let temp = {filename:result.rows[0].filename, type:'file_open', data:`${result.rows[0].data_file.substr(result.rows[0].data_file.lastIndexOf(',')+1)}`}
        // let fileStr=result.rows[0].data_file.substr(result.rows[0].data_file.lastIndexOf(',')+1);
        // console.log('fileStr',fileStr)
        console.log('filename',result.rows[0].filename)
        sdServerWSConfig.connect.clients.forEach(async function each(ws) {
            ws.send(JSON.stringify(temp))
        });
    });
    // hrReportInData.useMacroscop=Number(constants.hardware.useMacroscop);
    // console.log(hrReportInData, hrReportInData.start_date);
    // setTimeout(() => { res.send(JSON.stringify({ result: true })) }, 5000)
});

app.post('/api/notifications', (req, res, next) => {
        let temp = {type:'notification'}
        sdServerWSConfig.connect.clients.forEach(async function each(ws) {
            ws.send(JSON.stringify(temp))
        });
    console.log('notification arrived')
});

let countPgClient = new pg.Client(connectionString);
countPgClient.connect();
app.post('/api/count/get_approved', async (req, res, next) => {
    //console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbb',req.body)
    if (req.body.userId && req.body.position[0]) {
        await countPgClient.query(`select approved,rejected,onaproval from
            (SELECT count(*) from documents where user_id=${req.body.userId} and status_id=4) as approved,
            (SELECT count(*) from documents where user_id=${req.body.userId} and status_id=2) as rejected,
(select count(*) from documents where status_id !=4 and step in (
select (e.obj->>'step')::int
from document_routes
cross join json_array_elements(routes) as e(obj)
where (obj->>'step')::int in
(
select (e.obj->>'step')::int
from document_routes
cross join json_array_elements(routes) as e(obj)
where (obj->>'positionId')::int=any(array[${req.body.position[0].split()}])
)
)


and route_id in(select id from
(select id, json_array_elements(routes) as elem from document_routes)
as docelem where(elem->> 'positionId'):: int = any(array[${req.body.position[0].split()}]))) as onaproval`,
            (err, result) => {
            if (err) {
                return console.error('error head reply pg query:', err);
            }
            //console.log("result.rows[0].id", result.rows[0])
            res.send(JSON.stringify(result.rows[0]));
        });
    };
});


// предварительная обработка GET запросов
app.get('/*', (req, res, next) => {
    console.log(req.url);

    switch (req.url) {
        case '/logout': case '/logout/':
            req.logOut();
            res.redirect('/login');
            console.log(1000);
            break;
		case '/help/hr': case '/help/hr': //ura
			//let data = fs.readFileSync('hr.pdf');
			res.contentType("application/pdf");
			res.send(fs.readFileSync('hr.pdf'));
            break;
		case '/help/admin': case '/help/admin': //ura
			res.contentType("application/pdf");
			res.send(fs.readFileSync('admin.pdf'));
            break;
        // monitor
        case '/graphql': case '/graphql/':
            return next();
        case '/login': case '/login/':
            return next();
        case '/test': case '/test/':
            return next();
        default:
            checkAuthenticated(req, res, () => {
                //res.sendFile(path.join(__dirname + '/build/index.html'));
				let html=fs.readFileSync(path.join(__dirname + '/build/index.html'), 'utf8');
				html = html.replace("__SERVER_DATA__", getHost);
				res.end(html);
            });
    }
});

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "./uploads");
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
});

app.use(multer({storage:storageConfig}).single("file"));
app.post("/document-control", function (req, res, next) {

    let filedata = req.file;
    if(!filedata)
        res.send("Ошибка при загрузке файла");
    else
        res.send("Файл загружен");
});

app.post("/get-file", async (req, res) => {
    const { writeFile } = require('fs');
    const { promisify } = require('util');
    const writeFilePromise = promisify(writeFile);

    let client = require("./config/pgConfig")
    console.log(req.body)
    let id = req.body.id

    let result = await client.query(`SELECT * FROM document_files WHERE id = ${id}`)
    console.log(result.rows[0].filename);

    res.json({ result: result.rows[0] })
})

// обработка GET/POST

//// среда тестирования запросов graphql
app.get('/graphql', checkAuthenticated, (req, res, next) => {
    if (req.user.admin) {
        return next();
    }
    //res.sendFile(path.join(__dirname + '/build/index.html'));
	let html=fs.readFileSync(path.join(__dirname + '/build/index.html'), 'utf8');
	html = html.replace("__SERVER_DATA__", getHost);
	res.end(html);
});
//// авторизация, через graphql не работает (не нашел)
app.get('/login', checkNotAuthenticated, (req, res) => {
    //res.sendFile(path.join(__dirname + '/build/index.html'));
	let html=fs.readFileSync(path.join(__dirname + '/build/index.html'), 'utf8');
	html = html.replace("__SERVER_DATA__", getHost);
	res.end(html);
});
app.post('/login', checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    })(req, res, next)
});
//// конвой (убрать, было для теста)
app.post('/test', (req, res, next) => {
    console.log(req.body);
    res.send(JSON.stringify({result: true}));
});


(async () => {
    // подключение к БД
    await client.connect();
    // инициализация авторизации
    initializePassport({passport, client});
    // создание graphql сервера (экземпляра)
    const server = new ApolloServer({
        path: constants.graphql.path,
        typeDefs,
        resolvers: resolvers,
        debug: false,
        subscriptions: {
            path: constants.graphql.path,
            onConnect: (connectionParams, webSocket) => {
                console.log('Connected to websocket')
            },
        },
        context: ({req, res, next, connection}) => {
            if (req) {
                //console.log(req.isAuthenticated());
					//const { parse } = require('graphql');
					//let ttt = parse(req.body.query);
					//console.log(ttt);
                return {body: req.body, req, res, next};
            }
            if (connection) {
                return {connection};
            }
        },
    });
    server.applyMiddleware({app, cors: false});
    server.installSubscriptionHandlers(graphQLWebSocket);
    // Start server
    httpsServer.listen(constants.port, constants.host, function () {
        console.log(`|----------------------------------------------------------------------------------------------------------------------|`)
        console.log(`|🚀 Web server started at  : https://${constants.host}:${constants.port}/                                                                |`)
        console.log(`|----------------------------------------------------------------------------------------------------------------------|`)
        console.log(`|🚀 Server           ready at : https://${constants.host}:${constants.port}${constants.graphql.path}                                                      |`)
        console.log(`|🚀 Subscriptions    ready at : wss://${constants.host}:${constants.port}${constants.graphql.path}                                                        |`)
        console.log(`|🚀 Zik-Skud         ready at : ws://${constants.host}:${constants.guard.port}${constants.guard.path}                  |`)
        console.log(`|----------------------------------------------------------------------------------------------------------------------|`)
		//project information
		console.log("HTTP server mode:",app.settings.env);
		//console.log("NodeJS mode:",process.env.NODE_ENV);
		//console.log("Zik-Skud version:",process.env.npm_package_version);
    });
    // upgrade HTTP до WS
    httpsServer.on('upgrade', (request, socket, head) => {
        const {url} = request;
        console.log(request.socket.remoteAddress, new Date(), `REQUEST WS: ${url}`);

        switch (url) {
            case constants.graphql.path:
                console.log('\x1b[35m%s\x1b[0m', '----connect', constants.graphql.path);
                graphQLWebSocket.handleUpgrade(request, socket, head, ws => {
                    graphQLWebSocket.emit('connection', ws)
                })
                break;
            default:
                console.log(request.socket.remoteAddress, new Date(), `REQUEST WS: ${url}, destroy`);
                socket.destroy();
                break;
        }
    });

    sdServerWSConfig.connect.on('connection', function (ws, req, next) {
        console.log("Replication client connected:", req.url);
        console.log(req.socket.remoteAddress, new Date(), 'open');
        console.log("Total replication clients connected:", sdServerWSConfig.connect.clients.size);
        skudLogger(debugFileLog, "WS connect event. Remote host connected: " + req.socket.remoteAddress, fs);

        ws.isAlive = true;
        ws.on('pong', () => { heartbeat(ws) });
        //console.log('this', ws)
        //replicationInterval;
        //console.log('ws',ws)

        let pgClient = new pg.Client(connectionString);
        pgClient.connect();
        console.log('Replication DB client connected for ws client:', req.socket.remoteAddress);

        ws.on('message', async function incoming(message) {
            //skudLogger(debugFileLog,"on message",fs);
            let tmp = JSON.parse(message);
            console.log('\x1b[31m%s\x1b[0m', req.socket.remoteAddress, new Date(), 'Replication received:', ws.id, tmp.type);

            if (tmp.type == 'testPy') {
                    pgClient.query(`SELECT domain_username FROM users WHERE domain_username = '${tmp.data}'`, (err, result) => {
                        if (err) {
                            return console.error('psql error:', err);
                        }
                        if (result.rows[0].domain_username == tmp.data) {
                            ws.username = tmp.data;
                            console.log('ws auth:', tmp);
                        }
                        else {
                            console.error('not ws auth:', tmp);
                        }
                    });
                /*let temp = {}
                temp.data = `iVBORw0KGgoAAAANSUhEUgAAAEAAAABXCAIAAAA72NSqAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAD8ySURBVHheJXkHVGJZ1vUz5xzLbJlzzlnMEUFERURFBUUFwYiICUVEMOesmDHnVKYqrWzl6grd1V3TYaa7p9P0hG+S/61/1rrL9USXnnPP3vvsDRCbXfPkyd2HD2+vLI7l4hN9vC0nxlv3dub6+rgXd06++frj/bv3pgXjPF5DQT4mOzMuAxtVREptbapoaChnMqm3z7Yv7+zOzQxUVeTlZCHZrFJaESYK5uTvYUYlpZRT0sMD7T0cDXiN1Gf3dxan2qeGmhur86NDnLKxUW3NpVUlmcX56DRUcDo6JAURmBDliYj2ystCEDMTUBEB4X4ung7mHo7WDtbmSnLSIhAkJiYGQaKQiJiomISIqLiIiBiEx6OfPr/72durD++udrdmCgtSJyd4w4PcpaWJJeHsyxfPjg4OFxdmVldnOOwKZhWxhV2WgY1LRoRNTPUvLk4IBIN37x729TSvrUwWF+FS0RGMstwiYnJVGb6EnFZTkbu20L+1PLy7Njo71tJQlTsxwOpro1OIKFxyaGyYSyoyEBnjhYj2zMcngBMZ7NjAKGiqIYcHOqbGBUcFuiKjA1FxYR7OtrraajLS4qAHcXFJULeYmMSnTsDB4hDjk33PXt7v6+ay6ku3NgT9fY2jI9yDPWFPJ/fe3dvPnz1ZXJienR4Y6GteXOgfG+Yh4oITYoNn5ya/+vh2dm68u7tld1c4O90fEeZBpWQuzPbnZCVEwlwo+akj/Y3H+7PPHu3vbU5wGwrmxjlDXcwqWnpfG6O9ubSRWcCqJnHqKW3NFexaSksDDRntX5CNJhNS0xLDU+BBqOiAZHhoZLCnu7OVjbmRhqqCnLSYqAgkJgrJSsuIi4qBfiBQwWfvXiytLOTnZZML8BVleWuro6DQuZm+4UF+b1fr4wcX6yszXA7j2dPj41vCoADn+BgYPgOzvrny8PG9mdmJjs4WMIra2hIel0nISTo7WRseaKksI4yP8JcXB/d3ZsZHWjZWR8a6mZ3s4tHeusHOmuWZrnfPTl89Olye7h3tb6mk5eBSokvJeAwqEp0QmoKIyMIkoOGBqYhQZGxAkI9DfHRgbGSgmZGOubGuhoqipqqSgY6WioK8pKgYtHew/f6Ld5f37u5srzOrK8bHu5eEg5MTbWAI0xM9BzvC3k4OvYzU1VH/+fv7F7e3RobaWjmswrzc9s62zz+8PTrZW1qeKSjIyslJeXp1NtjPLSshDPS19HazAQ4FE51jw9yRQc7CbG8bq6i2FHfnaG68v1Ew1HLvZOX989usqgIsOhqXEkstyABFc+orNoSTdBopOsQ3Ky0OgwpPS4pIhIcUELFF+ThYgHtEiE9EaKCdtZmulrqCjKSGijLE5TW/ePn6m2+/v3t5h9fKHhzuGJvoGh1ra2wo6Wxv6O/mNNTQOnh1HW31vd3Ni4tjHz68Pj07nJ2bev/V56/fv1rfXd7YXuS3N1bQC6lUYklJPrOc3NXW1Mqp5XFrBIL+ZeEIuIvJsdahdgadjJ0dbtkSDo31NvbwmSO9TQA2WenI9ta65YUxbnPN9OTAs6uL4YF2dGJ0TLRXbJRXQpwfIRtVwygEB4+Nz89OAn0625hYGt/Q11b1crWHisgE4dLcn/703cnxwcK84OXLR+/ePT08XF1aHJsTDIDWJ8a6FudHWCx6QUH2xeXp6zcvnjy7evn6xet37yemBRtbq+tby7cvDja35ymUbBqNQC3KAaXs7682NzPT0uAdnay93ZnxMd54fwOvkTI52Pj8we7O6giXRS0kopobKN3tjUd7y5fnu3fOd9ZXBeOjnatLAjarKiTYBZCKmJPUUFtMIqJzcPHUgrRSMi4/OxkVD4sI8vB2twv0dYGCgl3Ly0nn53tAT9va2PNzU5MTw2/ePH357N7W2kwHr35ktP3oaG16ZnRgsGdgqP/49OTuwwdfffP1g4dPxsYnxybGJ6dGR8f6Dm9tfPHl842tuaYmZnk5+ez8YGNrYWikfWNr9vz25tBw64KA38UrHwAEmO0e6q3vaa8GZ266c3dzbmKko666uKuDBeRYuDAiXBhtbWHyuIyhgRZ+a3VBXjIWHV5GxjHLcyh56MKcZGo+NhMTC9iSmhQFpWOjAV4LSemC6T6g/Q0NVTvba4eHm2vL0+vLk82NZQvzfc+enF/ePgBa1NrasrGxNjU9uby6KBQKx8ZGBILJicmRy7vnn715fvfe+fLKfGNzDb+j+c7d4z9+/+FPP3zx5t3jvX0hmAM5L6WmMq+Wnj/Q1TA13razOfX6xfnSwgCJmPI/kMwIep48Pv715y/XV6dy8Em9fezV5bG97VnBRHtWWkygl0VWSgSNlJyTHpONjS4ioME0ioip0OLcwKtnF2MjHSe3VvoHuMug6GZmYX7mowe3jg8XqytyVud7Vxb6mmqpFSV5IwPth3vrM1PDIyM9Lc2Mnh6uUCg4Pzt69uzJ/v6+ULhcU1PHamFOzQwdHm9+/Pr1u8+v5uaHQPV19SVkUkZfF3t0kL+2NHF5vnPvzt6tw5XV5QkAj4ZacndHLZ9XNdjPGR9ta+fXlFDxmTh4d2dDB7/69GDx4ngpAx0W6medi4lMT4KhYnwYpfi+dmZrIw063F8CcL9755DDpi8LxzY2ZxjV5Ppa2v7u/NPHR508OtDsppqCFERAfXXe5srw+cnandOtjRXB5too0CsgnbdvH4J9t7d3sLS8vrt36+zu/sntbV5bHVCCjU3Bxtpka0tVXQ3lcHfl7u2DhZmRTn7D4e4SIFhXR+PwIA+UXkoF26M3MyMOkxrRUEdt4zHBzqGX59YxCwHum+qKTvfnAPUri9OTor3ys+LzMuIL8IgKcvpwTwNUWkbMykp+//nL+5dnqWh4dTUNMBio/uLs0LPHZ+OD/EZmEdim8wK+cI63utwz2N8AxPTh/Vt3ToQDvQ30svyZqcG52amrq0ff/vG7Lz58tbY109YFmNPazKadnyz1dddRCtPaWqt2NubevX64Kpzo7WzaWpsuL8lp5zHBWrx9utrOYwAslZXiEfCglubK1y8vAPSL8pLI+WgOq5hOywTo5zeWgIqJuDgmNYtByUhNCEREelZR8VB9A21mbujq6cXXX35VRi3OJ2TMfNK+MXDNb57d3VtfWJ4bvn97c2GurYaZUV6O6emre/nq4uxs98mD3emxNoCKDn7jgwfnz188Bitlc3utvbuBXp0vmOno6mCMDjQKZ7sy0yIBX2cme0HdoGKw5k5vLTU3lhTmo8GOq60uiIv2BnKZkhyWnBReX1v8/OnZ/Gx/RXF6QQ4CmwTLTI0ozE1Ex/llY6LYzMIqciY1N7mchAXVYxAwqJ5ZKpwXTE2OPLp88OblCxQisoSaA1DIYVftbixNjQ69uro8PVhi1eRNjdW3cEizs7xHjw8/++zhnVvLZcXpTAZhYpz/449fnp8fzM9PLCyMgyXI5ZQM9laPD9aPD7KamKTEGC9qPuru+WoruwRcKrUwtaethscur6ThB7tZ3ObStJSIhPhAsHbW1qbPzrYB6QUz/YzSLHxaJDipiICM5FBUrDeTljnAZxRmJuSnwysK0usq8lKRMKi5vkww3lNVQd5YWrp75wRcJ1DV2NigidGeuenx2cmxi7O9Nk719tro7uZQTxf9YH/68dXR6FgH4BCrhpRHQMxMd7x6fU8onLy6OgeUHehndbRVFBcihDOtnz05mBnllhYm49CBQDrHBptSEgPNjRUxSbDVxf73r28vznQ1N1IL81Na2BW93Y2PHx6/f/vo/Pb2yuo4mYgiZSfkZcVjUcExIU4BHqasSkIvt7KEmDzUVlNflouOC6CSMNBId0Mnt6qusqCpgb60MHH//hmJhK+ooNy7e76zsTo/PXl2vD011j013rG+MjrYxzo7XQH83t1bvDxb4XNKi8nJiws93T0NXd1Ngume4SFOXw+zu728ugJTz8gSCngrs53rC10LU5yEaLcKahqPXYyK8wHAWFvo298Y3xAOlJAxwLo+uNi4OF8HfNjfmWvlVoK/I5xpH+iqrqBgslJDEyJdk6I9UFHu5QXJM4MtU31sMAeYtxXgJzTYVoWO8W5toALlOdxfBsEgn5S7vCx8/OjB2enRyvLCinAKLDWwIwGIW4F0djYIF4ZOjpfGB9i41JC+HsbQUAM6KbiElgmP9+lor2LVEojZkTV0bFcrZbijioiN7OWXJ0Q5xkU4V5XiQE25GVHg9HVUlZJT9jdH+ewSYK1BNhDOdi/N9WwsD9FLs+oYeQdbY6B5YL+ba0mtdYXV1HQmDddaUwBQVEUG7skvIcLjE4T4DeSUON+WmsK+nqb5+RFARzq94u3btxcXF01NrMdX95eWpsbHe8GiWBWOd7XXAbf85NFhV3s1lZRcXow5P55hMnJCgx3QiUHhoY7E3PjcjAhnW9XYMGs+i9RIzwXKHexhEguz7mwtG+qpKaOkZqWFYVABmZhQ8DzYzaRTce72usSMWBB3zg7mhnvqszARSfG+mSkhBFxUYzVxpJO5PttVX5qVHO1Jy0VWFqV1sksJaVHYRBgqzheKC3Pp5TGba2llZflcbh0wao1s1uMnVz19vWxO04cv321tLdbVlQ4NtG5vTG6tjnz57u7BNngY7m9jTg43vXqy++zRTn9XLYtZBH4KTE5ueqSn4w0vB82EMOfUWD9PG10rA/melpIOTpmPi1GYvw0AdGZKWGEOHJwubhkoKMD1JszTNDMpGFwzOBWFGEYxLjzA2sfFICc1rKWGBOrOTAzyc9TPQgWX5KFpxCR8clhcqCvYypCX880WVsXelhCNjm9k1bx4+WRrZ33/cG9kbBg8vHj1dHtbODjEG+xrWl3suTydf/Zw89Hl2tHOxK5wGISs1bmut89PNpdGjrbmLm+tUAhJjpYaAa5GUQE2Xra6Zlqy1noqzuaaME/zIE8LY20pCwMFezP1MD9bsFaBsACNAuXGwZxS433IWfEhHqa+DnqZiTDhGH9/ZWR1uqs4NzE60B4d5QWHOaPDPZAwF3ioE4BlYRYcHe8bE+oCIWICm+orJ8cGSfm57W3ckdGB+cWZ91+9m5yd2NrffPf5Z2/eXJ0erwsXeprqCbsbvfsbfR0c6tRQ03g3C9wEOt4bLMi6clI/n1WSn64iAblYajqYqjqZqtkZKbua65poyFvrKZnryFoaKtubabrbGfi5mtmaqHo6GEQE2Ae4m4V5WdkZKaXEeBFSw92s1Hzsdd0stTysb9SX53Bri0BvLuYaWHjApxPrh4sPQEa4xsEcOppKJgaaOrmVUH0NZWKsvbAofXNlEQiRcHni1un2V1+/2wUGeWft9p2jVy8unz87mZ1qaWDgRnvKivDhKVEuI/wqbIw3KsTZw1LD1lAeVGBrpKqjLGmhr+5vbehmrGmmJmOhruBtZRzkYg2G4GR2w8FEw85Q1VJHycvSwNfGGOZsGephjQxzTwhws9FVDHYzi/KzDfEwD/W08LDQCnO38He+GeplZWuoZKgqAsZCzoilZcfnJAXFhziCCZcUoOfGeVPDHGi4vxUYlTxi0sRI9/np1pOn589eXK6szx4cbu7urq6vz715fff5k6PRfmZdBaY4NyI1ypFRgKLgYhOCnIKdb9obytvoyZiqi2tLQzekISMlaXsdJZiDeYiTte0NVVtddS9LYycjbV8bE08LfVB0oIOFg54G+JGRkoSzqZaDsbqjoYajkVpsgDMYBbh4RxNVewOlEFczeIi7r6ORn5Mx6MrP0TAuyD450h0V5pKBCgIQ6mwpraBgbUxVoM3V6TCYc1kJbnyw5XBvjsOuODnd2NldAGFKMNl7cXvnzfNzQM3VGW5vM6melthETWHmJUa53fS21HPQV3IxVrPSlLqpJBJsaxzmYAWzsQh2NPc01/Mw1Q93tUcG+oa7OrrdNDCQk9KVglQhyElPy9fipquxrq2umoOxpqmmXIC9eYi7TaCzWVygi6WunKmWlJm2tLu5lp2phputfqiXDczDwtveINLXJjbQITbQDmgamwGkqZZCREUFO0AsJtXKVDkmwg4R497dVtXVXnO4vwhyfTO79O6dzXcvL3dWhoEMMyhJNRRkY3FSWpi9p6FcgJm6u76mnbqCm74aJtS7GAPn04vbGaXlWViAmUBnq9TIYF5VeXdddQO5aIjdxC0rJcRHJ/p6RjjauxsbRLo7hrnZg2mYaclbaSuD37c1UIO5Wbua3/CyMfC01ge0sdBXsTJU83a6GeXvGOBiEuhqGh/sBKgM9AoV5UkloDJQsKQ4H4hWkIpFB+TnhGekBAx11y1O940McoGL3FgbfvvydHm2h99QzK7KaaClpkU7oYOsSAjfRG8rS3nI31C/OBF+LBgZa66tKcSTUhHIMH9vOwuTG8ohHg4JIf7hni7+tpaIQH8WpZhBzOuvZU5xOXNdndkJsfyqcnI6Ot7fHSiug4GmqZqcvryonZ5qnJ8LqB5Q5aamtLmesr2ptu1NzQAXsxBPSxcLrQBn42h/Oz9nI1tjJeCrwTbISY2AwD4aH6xdXeT3d5RODjUf7y3tbc1/eH/vycONjaUeXiN1uI051V1XlB7uZ6XiZaKIj/RkZKHCbY2n2Y3Cdh6/lIIO8dOWFTHUkNfTUNBQltVVVVCTFVORFlGVEjFQkdOWlVITFzFWUbHSUI/x9sxGwDPjYzcmRqa7ebSMlPTokGx4uIWarLOBRpirdayvs4uZtrWBorudHpiAqY4ioL6HjT54xeGmaoSPtauFJlA5J3N1DNy/lpbVwaJBYBE+vbcJZHG4p/J4d+bdi4f3L44eP9g92hvt6ygHm3xlrJ2el+IJMGOsmAxzRvk7luIS390+PJgTxPm42eioakhDN7WVFCUgWTFITVFWQ1ketKEkDSlIQhryEpoKkuBHmnJSN+SkdRVkVcQgNwvTIGe7spz0HcFIO4M2DgJgYmyko1Wch0OoixUixAPoj/ENSVdLPRtDFfub6kCOnc00gLb62xv42N7wdzEOcjcN97ZCRXiU56dAnLqiW1uCyYGWRUHz1vLom2cPv/r8xeHezPhwTUcrubo0IyMuMN7f3ttCM87LMjsusCQ9obu2fLqjJdTXTVdVxkhL0dxATU9N1kBD+YaKooaCnKqSLDhS4pCOpoKqopiyDKSvqagsI6IiLaYhL6WtJAua0ZAWtdRS9rE0LsYmNhBxvVXUKAdLG1U5W20lAKFwf7tAL3N3az1zHXkrXUUjNTFw8UDxQPXBLkZu1trBbqaBLjeB7MLczSDBCHdpphtkrvPjjZEB3tnJxt//8ceV5eH6WtLZrWl2XV6Mv5uXlY6/jU6ogzEdj/n87vkAu9HN3ERXR0NDQ05HR1lTS0lbW1NRSUVcQkpEVFxaTlxGTlJOQVZWXkZOUUpeQUJOXlJRUV5VXUpGDlKSlwJN6qsq35ASM5YVd9JWSfF3aSshCTi1JZhEuLeDhYaUtY4sItQ5JdLLy+rGTVUxNzNNX1t9J2PVUDdzIK/+TgZAu5EhTmARhbubQmcH80fbgh4+AzTQ282enx3803efDQ02Z2AiuI1kAKEQVwtvS504H9v8xPDdiaHDWUGwo63DTR1ZKQiHhUfHeEtIQxIyECQJyShDonIQJAVBYhAkISIiKQqJQ9IASRKQiBgkLSeqrqGkpqqoowkal70hJ2ukKKstATloKaSH+XZVFXOKCTHuNtnw0AA7Y3N1aT87fbDRYC6msX72oG7Qw6fq7Q197XSifCzRYa6g+jA3E2h2nHdxLJybalucH5wR9IwMtW5tCITz/eWUjAx0WBE+IdrLJtjxJsLXYZrfDJQE5mhrcUPZ/qaqpjrk7W1QRkc18bI7R2h9U9XHj2cfvNvcvpwaXORw+qsaOmmMlrykbJhXiLmavqiMvMSnt5NFIHUNZTUlRTVFOW1FBRVJcU0xyExVLtDWGB8bSIiHEeFhZdikBE8X15vq4PhY63iYa7qZaXwigI0u+BruYREf4BDooA9OqOtNaGKQPS9ov30839lRs7oycutwaWFuYGNpDCROCh6Jiw8McTEJdjAWtLOX+rvifDwstZR0lSFrM2kyJWR7n/3tTxu//ffk5/+eX31cePfz/uUXc7tX0xfvtw6fLC4eDz75ePjTf19/9eujR+8PJuZ6cwpSdYxVxGUhUQlIUUlWUUFOQ0X1hoKCprSErqyo+02toqQocmJkZVoSMTLM31I3yN5ITw4yURV1MlYBiApwMAx1M8uABybCXJDBjvH+toggOwh4zL5Oxub6wNBg08J8z+JC/9R429riUBoyBOZmGWhvFGRvWJKJvDpYb62kAebdUITMjKAWDvbt12M//2vtu7/Ovfp2ZOWsvrA2oqA2tqYnu2WCNrbdKtjrbBwszmcgiuoSs0ujZ3c6v/vt2d+vP3731xfD81wnPzMxOUhcRgwSE1VTVNdWUlaVEtMQh8IcTTBBrrVZydTEqBBbI1cDFQt1CXczjezEkChv6wgv86RwVzwiMMrLIsLDDBlkF+SoB60Je8tL0169ONjdnhgeaAJJpYNfXVNBxCYExQc4RnhYAFDuTPUfLozH+7sqiUEaytDSCvM/15df/33mzY9Dt1+1UBthaKLr9Bb/469PPv/p8a0nc+PrrYLN9v3705//dPuLn88HFmqDEqxjkp2HFuo+//H05+sX3//zeVULKS41DJL59GmLgrysiYG2pgykKwN5GWvkx8Ea89I7ywsAoixUxPxs9QBmAPT9HfQAcXFxviHOBo4GsrE+FsggG2hrdbCro+LVy71be9PDfQ0gd1eWZBbkIEFuiPaxAUSpwKcLBzrLCan6qpC6IjQ6VvqP69u//Hv9za/TQ+v5+bXB3GHyx19f3L66hSWmWjjcFJcTA9wVl5UUkRYB3+YVZ919cvr5H982tlN9o8xbR4pPno1ffbXy9V/v/vCvV8OLLRIK4JchMTHIREdFXRIyVpAMsTFPCfTqqSya49Wjg1zs9RXsDORs9WVNNUSdjBTD3Yz9bDQC7bX9bTWL0sKgsRHWxZ35/f3R04Pp+iqicLaLnJ+Ukx6dlx4T7mmGR/hP8lqaS8kOhqqqUpBgovaHn4/+8t+9N3/saRPmRWVbnL9ZePOnh4h0BCQqKiopA4l/+uRHRFRSVEwK8FVMWlQMCJQ4hMtNf/Px6vG7Y2S2d1ZJIH8i78kfhO/+fPDb9av142k9c0UxSUhBBjJWV9SWFLfR1AiysuosyT8WDGRE+droyALRzEjwdzFVcTSUc9CXcjdVjPK8Cfe3/DQBZlnmnz5egSQ6M8EHUXpxpjMzLQIZ4wWPcMPEB/RwqqY62hKCA0BSycYF/Pv68sd/rnz529ziSRWS7Lr1cPzj7+8JJSRZNdVPxBSXAnVLS0uDHqRlFIGUikvIQiL/X0RFRSBZaPd848MPz4MRdgXMqH4h+cnX03/6z61frq+WjzoNrGRAD2CL6ykqGivKBlnfzAr1O5sdnWytcTVRa67MHW6ne9qqe9qq+tmpxfmZpIQ7xHuboUMdoJb6ws+eHIFk0FJP7uVXjfaxqsvwWSkRIDeV5mEFffxaWqGRmpyeusijB4Ifft/68LPg9mft5bxY3mT5b9ffSKpL4IvysTlECVlFWQV1EXE5RSV1WTllSbC7FLUVFLQUFDSkpOVBS+Jy4mA/nD06unyxb+QoQ2Uhzl+NXv1h7uhq6Pt/Ptg+G9XSk1SQFTNUV72prOhhohdhd3OYVXG5NpUQaE9KCydgYI6msjFBZlHeRgEOGnB/81CnG7E+ZtDtvWnhBK+/vbqTTRvg0wm4mO2l4WxsLIWI5dYBLqOTYsPkxaE0jN/f/nn507+2fvzvJn8qi9aC+O36T16hHqJy0pCYpJi0IiQiKyWnKaegA5aZnMINWXltRUUdCQkVNTV9VRUtSQlZSVkFCRl5sAp++Mu3vZMtDgE680etMwcNy+fNV18L/379dn69S0ISUpIWtTPUczTQCbLSp2cl7c300fPQMX7m8BDrMB9DJ3PZICet3CRfEPoJKD+Yky707HJjpJPZXE1ane4AcMrFxXbxqjPS4GtLAnppcViQv4uDuZgoNDtf98s/D774aerpNyMZpb6zhx13r+5CkpIALKKSSpCYvLzyDUlZDVEJdUVVffCgpKKvoKQrJ6chK6PyaS2DbQzJSnwirJRPUMDfr/+Gzolm8LOH1hn3vpp6/O3co48Lv1y/wmXHyklBFnra7ham/mYG2XGwcV5NczkhI8GXX0Ok5sZkJfnikV7lhFhQfSk+upqEgtanO/kNZCoB2ViTB+w0iYgeGmilUonCpdm6uhoVFRVxccjZVe/7345/+c/O3XfgzsoySmCvv7+fgk2DRCSlZNUUVXSk5TUkZFQlZNTllfXE5dTAM3hFSfWGoqKmpITcknBtYGAINCAuLg/4DYmInt8/P328j8j2Hdlk7jxtv/gwunKH/cv1k73zCTlZSF1O3MfO1tNIL9bdsa2CMsJhEtHhZYTEAmxEWT6ilpKEhFkH2mtWEuI7agjQ8gS/piSDW1tQW0mYneioqabs7i73D3SxOaxaVoOzu5uEFJRXiPj79YPnX/a//G5odq+6uo1w/vJITUMdXKesgiZAi7i0mqSsmoqGESSpKqWoKa+iJS6jJCoBoC9hZm7z3/9cX//3GoMhiIpJS0rJiEtKwCKCj+7uRKS4dc6XTh/Xr9xrFhxVffmXg39ev4OFOkhCkJu1pa+pkY+JYUUm5t7GXG0hDhXsFOlpGutvASaQGgXi+A1UqC09PwGaG+EA6APTRspC4jHw2al+wcTg+tpSezv/5OTk+vpaTkGUTEv+2/Xd11+Pnj7hVjQlDMyx57amPoFCXArAXVHFSEJaS1xaXUrhhrSi3v+uX1PHxMrWDQwBwGZ4WPDgwXM3jxAgSuKAL8AGikEPX1zWd1BJTHjvSunobuXOE/6DD5M//esRkQSXFgEBQ9PfwjjA0oiMjj1fHDtdGOxi5qFD7dDh9hXEeHigRZy/WayfKTE5AALQ3xT2tbLIA60NmISIKbDWWpuryks+fvF5V2d7RztfRla0kVP0y//d/u635bWjqkyy/+6d+c4x/qcGRMUUVQ2kZPWl5cBXXQk5XWlFA2V1IwiSd3ILPD59BIkoiIori4kpgQNBikCRlFQUP60KEWjnePPsyXYC3os3Q544YGw+4jz7dvb7f9xp6y4DNNBRVoTZ3Yz3sMuJDeqsyDtf6u9mEsqywsPcblAywkEPn1DkqAVG8end6TuHi7OjbfxmemE2hlVZPj86nBIX9c37533tTVJiEDjN3KK/XZ///J/l1bOKgurwq/e3Osd44uLiIqJScko6Mkr64Egr64pKayqomUgqaUoqaYNvdYzsxWW1ldQMwUwA11U1tQB+pGXkRMUkRKXE+AOc939+EJXhzOjCztxi7T/vPH3V9cv17Y39diV5SE5E1F5HJdLFnJAAG2wo3hxlC/jl1PQwuC9w1yax/sah7jdC3XTTYpyh+qq8zaWh5dm+GjphbryrEJ8CtB8Z7rM2O/Ty0Vmgl4OkGNQ/xPj9v6fv/zzy4tvhMjZ8+Wh483RJUhpsKAnAYIAcGWUdaaUb4nIan1AEOK2iA0mogH4k5G6AEckogGymraapKy2joKSsAZAnKikxtTz68PMjX4QphR1/8Hxg92n7wjEDAPXWnSFzE2VlSQkHXVVPMy0KJmq6jb462NDOwPtaKsEctKxvQH62qgS0X2VefDrcDRrqbRgdaOI3V+BSQ9qaS7GIwJzk0AFe+cJI6w8fnuNQMfKykGCu8etfVh9/aDt73VzJg5c14R6+Pf3kFMQlAcpFJJRlVW5IK2koauhKKmiIA3esqCMprwMaUNMyUVDRA5SQVlADkqqiogtB0mLiMgB7GwfC4cVWWJJV83ju6Db96Hnn2kXDl7+sv//DTmS4M+Cxs5Gmn41hbWFafWFyQXJgZqzr/xZwbqJvWU40JSMsPzUwyEUb2lwbPTla+PRxXUnacHc1WHiBzto1ZNRAc8nDg7WmEqqxgVx7N/mPv28//7bn/ldtVe2xiQSvL3+9Cgrxg8TFFJS1lNQA7g3llLQhKSVpJS1ZZT0wBwU1YykFXaCqYCfIKmpJyqnIyWrLy3/azSCziUiI//C3byubCUGJ5j1LxZsP+YL9SuFx9a/XZz/8duHnZwZo4GqiG+VtV1OU3ssqykn0RofZokKs68hoOhFRnhObg/JJgFn6OmpCXXz6wnTH88f7TUxCQVZkHhaGCrOK9TXKjPeZ6229WN/w97EsKUX+8S9773+afPPLaMcsDkV0evXdUd9Ih7iMhIS0kryirgxAjrwWQAuo/n8NgCFIyWmBA5YDaACgSFJCQ1ZWU0RETkRcxjfY/y/XP6TkhcRmOvavUs8+G1w5Z63dZv16ffvzr/dt7bWNDTSczfRxCWGtjIIWOr40J4aeD08Ks0sMscFEu0Z4GsODLTNQXvAwG2iop0Yw2jw3ztnfGEiOcY4PMqfnxZblRGbGe3XVlDzc3clMjUpN8fvw3fbnP81dfM5du0svqoeVslH/uP5BSkFMREJaWlZTQ8tUURloESC0ISgaXPz/qgfDARACWwK4DFVVA7Cwwe4TkZK4dff48P6arb9602DO+HbF4bPu/cdt8wc1v/737uWjWXMLDRtrM3ho0PLEQFs9NdBJr5QQO8SjMcnJkd5mlMwYVJgTOtopNsjC1VoJeni6uDjGbqJn7K91tjcSPCzlynMjSrPDKolxtWTcwfxYa32Fk6329kHnt3/dvPqm696X/MHlPJ8YjYevd95+fAS8DVB3CQklGTltZbWbcoqGwEqAI6OgDcAjr6wrC/ggq/lpFNJKkKgUJCEWFA37/fqXnNLkcKxDqyB/5pB58qp/47Jlcb/ui+93u4cqC8mZgqmJ3taWWxtLtkaqapJQDSVldaKFX5PPY5K4TFI6whceYhsLswz1MYIenwn/+PakqQKLT3FvqcZy6BgaPpiaFYSNcUyJdN5fGNwRzihKQ+lZAX+7vnz/6+Sbn0fWL2qodWEeMN2/XX/c3F8GkUpKSkleSRtUKaeoD0wRgM3/7h5cvJiUmpySLvBI4O7FZGR0TAx+v/597WQpCutX308YWCtdvWheOW8S3mLtXrb/4efTciYOi0PMzs5uLS5sLs4UEzBsBpFTnVNZiEqMcM5GhyRFeyRFu+VnhHe3kGeG66Ci9NAeVj6LguptKignRtNJUZlIx1y0e0q0fWyAWUdj4eOLvSJimquLwfJ2w3f/N/vqp/bjV6z26eykPOdYrP0v/3pzeGdVSl4CkgBHRkQaGGlJNXVNSSl5GRk1OUUtCCQaCWlRaWkRSRlnL6e/XP/x8NFiaIprHhPZv1K1cNZ08Lhv537X9mXX3Zfzf/77C3RaWHxCWF199URP35M75y8fnA511eZgw2JC7IK9zRwtNXxcjPCYsJLChPVFPp+VB2Uk+qLC7SY7K6Z7GMyixJQomzAPTXSUdTUZwSpLQ8BsFwXdXbw6XR3J1EyPb/+2cv8rzssfB5fPmZyR9AyaD4bk//GXqx//+jGXkiOvqQgBeyoJspj4p7eHPr1JJAN2HfhWRkmhprHu13//uLg/Yu6pGof3Hl5vmDliL543blzwD6/6j69Gv//7w29+unLzNo+HR3A47KONzd1lYVSgu6vtDRcb9dKixH5eeV56lL+7cRY6KDctiJQVCg5UTUvtbCqaHah5fntlsosR5qmPCrcuJUSV58WxSjC4eM+ZUe7G4qimmrids+qrPyy+/G7k3hcdJ6+4ggNa11xOOtUjFG3RNkZ//e29Oy+OhhZ6UrLT3YP87D3c9UzNjczNk9JSF1cXvv/5j+++fZmcG2PoJFfYgCprxQAfuv+s//j1wMFV9/3PZ55+tf7X63eTc3wbOyNceiqH3fzg9AyEdDe7mzh0yGBn1TfvzvgNhbHBtvEwu6Qo5ziYhY2ReHSgKdRcnVlJgo/waI9uLVLxcQUZEb0tFFYZJtLHmJoV3UBLI+Cibu3MEvBoYEtZrYTv/+/k/S/z977ouvWCs3Ba2TGby+hICkk2C0i0orIzZo/67rw+vf/u7v697dtPj7/++YtXH+6v7o4zGvPRuaGxOC98WUTXQtncMXvuhHX+Zuji/ejxs8H772Z/v351eC7QM5QPCvKil5RwGzmvrx4uTg5tLU3Oj7fNT7QIJzltjQXU3DgaIXaqr5qSE1mYFZad7A9tz7D62LnsksSp7rrinPi6UmwXu7CEGFeIC6XnI8nYyDBv05GOugfnuzracgAOwk3en/959uwPYw8+9J++bps/YbSMZ3QuUPLqo9PLwqIyXVBFIeml0Qm5fsUNGEodOhHvmZzjkZjlVMbB9C5Uts1Q2mYLhbebXv24fOtF796jzrtvpr/57eLv1x/gSH8pCSgDgy7Kzulu4b59ev9gfX51bqgAj0iIdMUl+vMa8onpoaOdFcLxpvz0EDzar72pEOJXIUc42fVF0UNc6rPbC/x6IoOW1MzIKs1LqMpPqiAgs5CBJYSkd8/O2zk10pKQuraIcJP7278vwdZ88oepnYdc4Vnd3En98HZl2xyZ3pXG6Emjd6WW8VAFdZFlnIRKHmJQSBlbo7VPF4AACe4eZMiDpx23nnXtP+zcf9Dzj+vP/u/6i/omsrqqpJeTfW5qalJEeHdj/f2T7YvD1abqoogA+4xkmFDAq6fj87IieA3EaloyARsSF+ZwebwAkZIdSzJ8yrIDK/Oj31+ttNRkxoaYLQs4/Pp8Dj1H0FWHDnFLCHboai57+egkyM9VTARS04DuPJj+y39vP3o3+vzbmfPPetYfsJcuWEuXzRMHzLGdyplbtZP7jI7ZPCCRc4fVc0eMo2cd2w9bJ3cYm/fab78Z3b7PvfduBOjmu+/2/vLPzzp7qzzdLbTVlPBoNCo0dLilaWN8gEJInh7mvXt2eu9k5cH56mdPDliMHGYZbkPYvrPai8eGtjRQvvjsLlRHDmcWhJFxPvmpnqcb7SfbXQHuWsFeejtL3ZM99cWZCZTU2ORwN6DB90/XV+enbhrqgDmYW8mvH7B+v77z+ru5nYfs41ftp++6957xb38+dOt5/+HT3qNnfU++WQANAJwcPus8fzNw+rp36wHv1vPBk5eDh086Hrwde/Pt2i//epKRHSmvCJkaa8N8vOBBIQQUantq5MODk9Xprl3hsHC8fbirnlmGL6OkNtXmjw3UbS53d3Bp1IKkq/s7s4IeqKMGXUeNZBSFV+WGs0uQnfUZtFxYZRGczci9tTnHZ1WNdbD6m6vSIn0mePU/vLni1VZoKMuCmK+hKT4wUv/y88233629/fPSvS8GDp/zFs8YG3cb9674m/dbX/55DUxj42HL3Q99977qefRxYudB68YdztUXsy+/Wvvu54t/XL87u5z193XU0VBytbEN9wnAxSOenxwK+A2CNubp6mhJDrychELHuAO0RATalJPT1hf6Kim4lZmeWxsTPa1VwV6WUFM5nEmJ7OPmcMvQdEIYCeNRiPM9XOsoJsS1NlA/fvZ4a66/NCeJSUorAta8k3W4PFVXQdbVVBb7JPlQShbs2ecbv/z33l+uL68+TGxestdvN29dcjcuWy/fTm7fb7vzZvD8Ve/5685H76eef1z86qe9/1y//s/1u9//8ZrFLjA1UXR3snG1tUZERPrZuwg6ur64d7sYExfjZtJZTexpIIH8Fe5jPNnLbG8kg+xOSIsqzEHQqdjq0ozc9EhvZ32om5VRlhvcykw5EXKr8yJomX7MopjKgpjZoboqWno3l74wxgt1NwG2oruWyGfk9jWVnW8tcOsq9I1uACMkKQu5eBpn5UUMTTG+/NPhP66f/X79/Lfrp79fP337w87TD8Ivf9r74R/n/7p++s/rz/59/e6n3x9//OaCy6WFBDka6YFRQjY3TRDh0cHu3h11rKuD/ZayQlp67HwXo5ORjY93L8AEgX3azMhurMQjI1y97PVSkH656eFgN4f6m1ZSkyFuOaIY50XLBAgpGGzCU9K82hiY2mL4aHvpSBe9OC+R30BOjnF1M5MbbCIxiLGM/ERGfhowedymWhMDbXERSEockpWFVNRFwqJd07Mj6riUmbWOj39+8OWPF2++OX779fHzt7unFzO3Hwin5/nUknRzMzUJEbCyIXMDPTsTUxwiBRkSTc3K+eziYphTX4lHNVEwl2sDo80URz0xkNzjAixDvU0bqojwcHcGLYtVnT89xrl/tgjKO98bhWbb8hi5AYQEa35V6mJ/eScTy6YhpjupjWVo4USjcJJdTU0j4cJjfG9GeekG26sRET6tpTkkVEQnk9bHqo7y8VSRkADOQU5WWkNLFdjN/72ba2ipERLnHgb3NLe/oWekdNNcS99QRUQMUlGRUlGU0dfWsDUxD/bwC/OBBdi79zQ2Pz0+bq8um2yrIyL90yMcGymo0daSCmKCi4VKqLcln106PdbW38l6fPdwfXGgtZHGa6Tik4Mz0f7QQB2GVRROQjnSCyIHOIQhdu5MG6WRkgD3M2ytwZ1u988MN0z11ZTkxoS76QfYqHkYy5elRRPjAiIsbyx3Nh0JxnIS4E43zbSV1EUgcQV5FVVVZXVNFXEp6BPAZCDwICUrpqgkKyMhqq6soKGkZGVk4u/iERcUEekLq6GUT3d2t9IrBF3cshzUnY0RFgWdHuVQlBrQ11z85PZyL7eyv6NmbXFoqIe9sjiWiU2g5qWuzfUV5yYCRCVFuUKtZQkdNZjcJFdMnC2nMplfmdpRnkZJ8ol210qOsCglhgHXenkwVUPB5KJgFxuT/hYa3sYKXRU5PVRcWxFOyGfdXpwZbeFkJiQCGVGVUlCVkdXV0FCUlQFjkRAXlZIUl5EWl5eWMNMx8nF0jwkIiw8MRwZH1RRQm2kVF+ubXzy8i0dEwJxvssvTexvzZnsrWsow9UVIdkXmIL+il1sOAmUqEmZhqBrq54iKDXS20p4fbR3g02mEhB5OMVRbGMMkx9XSkLEwo2yUexsdyy1OwgSZ42PsaBmBRTj/8d6qFmZucXaCn53B7nTfQD0VZq3JKUqZriseY5IrMfA5bsPZvGB9ZLC7to6clo6Nj4/w9Q3y8IR5+0UGBsVHRqIR8ej4GEw0qpJIJSbiKrMLDwTCDxf37whXGFl4eh7ueGV8qouRkeCajXLtrM9kkOIrCLFtNbmV+cg8bHgRPiEm0HG8r+nu8XIzo6A4FwHkqI9b2tZAApYHAgmYQUka7632s1dJCDarJSP7WXl0QmRdQWxVdnBGlNkAh9zPLp3oZuEQwQCRe4sdeWgY0s8R6+NQgY5oyUtm5yKL4n16Kogngv47C2Pj3KaGIlJFVnZbBbOWRKWmEcmY3IpsSl1eOa+sdmt4fLKZ/WxndZHfxCvOZeWmBVppcWhpU20lRRif1CjLyryIqvw4H2vlUDc9Eia4sTQ9MdQx3NsiMdwVYMZMRzIlyqU4K7qqEEnODC/JjYaCnTRqitHtrAIQJpHB5pyKND4dN84jt5ShaDjfsgyfAkzARAd9prepvjTL31kHG+8GbivB385QAopxNm4iJdfnIOuy4J3FWfUZiYL6srnWujPB8E5/z1Rj463xyePJ2bPZ5aXOgdXescXO3pWeblyIX6i1IQ7mttHHuVwcAZqTGmIX46mfGm5RVwwvwgYQknxxsW5h7vpeVqrR3uYImD0OEWBnpBDkftNSXyYu2BbmYRzqZcKpJkz11UFeloqgmyoyOthJzdtKroeVO8GnTPCLCEjnypxgarpPeVYotzz9eKWfUZhUiAtJh7vxqvGt9Gw3cyVfG63C5NCLhWFyfHA5MrSnOJOOgtViIujI4GpU5FglZayC1ldMqc9Ip8TFjjXUk+Jjknycd4f5RcjA7EhXuJtRPTFhoKEgI8rZx0I+0l0bG2PfXI4py44Bf5/PzInyNonxsSBnxLLpBFZ57uZ8T3N1Xl56zFA7s5NNG+9pWJxqhzzM5cGkCMlBvjYK8f5GFYTI1krM1mQ9Jc2HhHYvTPGszA4tywwBk5noKMfGOdWXoNtq8UPc4uQYZ0NlKMBW9w8Pb20PtrqqSxAjXGhI31pMUFseItPHsijc86CnpSDcnxIfZiwGId1sTqf68REeE03FL/YnmgoS4j10ycleTCK8mZbcWoEF3KVmhtYUJU60ldMyo8m4sPQ4j5bKnDoqDhXhlhDiAiaQEuftYKGaFOdVV5nt5WwY4GkOhbvoMAsSk8LsQANEtFc20q2enDDIJnRWpxcme2XHO5ZmBBWn+WGjbLn09CpSQjE+orspb26wmpoVmRLu5GuhmRnle7Ey1krD5SV4xHnppQWZ1mdHtVNSIizUSxJDtwc4V1szaaFu3vpyXeVZnRWZCR56JVh/Oh5WgHKj4fyzYh0r8GG99YTV4bqFgRpMlGNJVhQpBZYS6YiJdq4iJYKY5WSq4u9kkBjpFhtsn4byQca6xIbb5WZE5OAioWB7DRouDA2zDnHRKkwLLEjxaWOkg68ASA1FCV1MfEkmjJTsmRRmRkT7tNAzAZBAggM9bE62cCvxtPRoL1O1qlwkeN5faM9J8nA3kUAFmnXSs7gUjIUihPC1ANWU5caXY8OaKUlNRYnoAJMKfMh4KwkbZZWX5MbMiwpxUI1y120sTqovRpNSA4F9KMLC0mKc6fkJY20Vews9rbX5qEgXViWeScNGwSz62kswSV55+MitlT4oJdQ6we8mPt4VF+2cFmFXmhnWwczwtZKjpAVVEeIai5NL8JGCrtKynPBgZ210mDOTnDbeQW+kpw+30mZ6a8i4iJKsmIpceG6S30RXxXQfowgXGOdnTM+O4RSnoHzNg2zUkUFWxGR/ItKTTUVzSlJivHQLU31bytHcqlR2eRKAKJhwDsKVhgshpwcDzWigJjFIsSlRdowCRGNpWhEuggckjIQsyo6eH2vq45UwqCkFOdGIaCdElMunBpD+JokBN1FBlmHON8A19NTluhlLxnkb8+mZtQWJ8EALQU/F1gwb5nLDWBkqxMYujXIYxah0hHcfl9ZQigHZv72WAGR7YbBufZIDPEhWArjXuLbSdG5x6mQLBTgocnogPTc6G+6WGmlHwcHKc6OyElwK0/zri5FlWUEdDGx/IwHQgF+dySxMKMGHknH+TDIiL9WvqSyNX5ubleSfBvdMhXuAHh4cz2/MdQ51VAiGG6NhthAuxp6IdPezlIv3s0AEWmJjnHFxroEOGu5mctPd9JWRRrAo4gPMZvtqQUBTl4KYxRnjPXXoGE8uqxiQiVuTV5mHyIB7kDBBDaXJY91lLYxM8I/z0V5ULMC3PQAkuyw1A+4ObpSKD+vnFAD49TaTuhuJ+Rh/Uqo/uySpgYIozQrBxTlScEGEZK/2uizhCLOtLruHnU/LiRAMVPW1UspJCd3NFCI2HEwQnwTLRoeUElFAXqHUMJsQB/UIF21qRoSdrhgy2DIt2gnsEXt9MSLab7ytlJjinRhiTUwOqipIyUkOL8tLnuhllReknu7NMIqx/a1lj29NF2Jh1YXITKR7VSF8bbKxn03Cwx0/BYycMHpORF8DsYeVD9gZ5W2Um+R7tNLdXp8DmsHBXVAhliS0b0lGKJgPGAujEF5dlJAOdykjRqMj7fm1+E4WoaUG396Yl5Xke3kkWJ1uiw60J2cj5oZaYgLsXczVIECAUCfNHLhbbqKvoQLU11SQCXcHUAl11UmJsAc9JIaag+KCnXULsFGX+wv52NjCzAReXfHsWKtwggeM6pt7q4tDdUujdWcbvaABHiNjd5bTVZtRTYxcG64GbSSHWgAr3s8uRIfZAjKQcaHRPsZgqh11hKp8eHacB9zXNN7HpBgXnpcS2MchN5RjgUbza3Nyk/3SkR6CgerFiaYmRmYpCbG/PlRRkFZCTF6a6AChjEZMhAqSA3IRXvVFKEC1aC/jBmpyoIOar41SNtID3Fk20is+0LgsN4aejyzCxUz3Nwt6OYGu5qhIn5I89On2JDzIujIvHhlikRxpOz9YXUGM66zLWR1raClPqcmPLkB7AhQBGWyvSu+ozW0qxTRXpDeVYYGaAWoVpMFaKrKGm4pLcFEFqSEAh6gwBwB3DNzbw1bz1no/iLRMGjo6yByT4D7YVTnSw1yb716a6S3IQTlZ3iBlJQx310Hk9JAJXgmvMiMtyhmUG+6uhwgyS4mwTQq1AlqWleAR4aUDpJvPJKREedgbqyyPd2HigwxUxYmYqMKM2ML0cHigeW1xIiAuwAMe4dlSiRV0lSeHA4n0zIp3SvA17GDgdkBLZdgjYSeLloKLd+dUZiyPsmP9zF2M5TglmV/c29wW8Gn4mOKc2Cx0EDkbHhvqiEcHLE1w7p/MAp+GjHbFogPqqnJGehuEM/2NNcVZaXHp6HBiZjyEiXQ6We5NDrNPi3CkpMESAy3ifYwQ/iZeZrIAnSDURfnoJUfYY2PdAYRcLbSqitLnR3gOJmqAzVQ8vL4klcfMrMyPBrABLhL0PNFeNtVZQc+H00lxLBr6ZKltlFOwNlBdW5DQXZszxi8pSg+x1hHJQvjszLZT0qMQgbZNJemd9XmZSK/6sjQQP25tT4z3N1aRU5DhTrhE/7lxDreRLBhpIeLhWHR4WnJMRQlxY3Vie0Mw0NUA1RSiOOU4YpI/MsACKCkB6QmqB8yGOaijgsyTQ2yiffXBBPzsNEtyENnoMCw8oI1F5TALYnxth3n0heH60/WeSG/drvrs4eZCsBOBcAFhBY11N5EE3fTWKhyIV2S0H6cEjYmwrqMkMkgJZbmxyRFO4+2VtKy4eipmoqsy3MuQTkZmJHqnIbzmRti7q0Pn29OArImRHgRcTFVJJq0IU0bJ4LVUEXPR9rb6GenxhaQ0ZlUBNMChAOgD90fGwDDh9hkxTmCpJYdYoWGWoIGsOBdg09Hhdja64h31hVwmCdA/OyWUSkDG+dvXULAgqRXhgnuaCJgo2wjXGzUkRBUJUYgNGeLRAlxuJEc5AFEuwYU0FiKridHcilSATADUsbayAQ61hpxcnBHDoeOfns+zKrFpCS5Lk00ttTkZqIAifDy3htzFLuexaLT8FF5TSSkZl5keX1ma9/aze7vbszn4JCajkMOugHqaioGv9LRWJqD8clE+mXBXYIfQYdaJMKukENtCTGgNJQEb6+JsIg8sYT+XPj3YzGHmZyTDctHB4OBRPmGe+o2lmO4GAui5KMW/qTSlk5W/tdDtbK2hrQwN8MrHeKUTXBoIipXEOBo+CtBmspcJUt6usHtrvkM40dbRRAV+3t9Zm5AS0Ntc1ETPAp7ZzVo7OzmiioqfHOQNdrLbONVDPRwQKcEQlhcHn13dOtiaJmQmQKS08EyET4S3UaSXUQ7KByyXTIRbWiwwUk4JQZaAWOXEaIDaKB/TAmwEyGVEbGR5QRLQY0IyDLyYGuOMCLHyd1Cd6akUtJcCoKfHuN7bn3pwIhROd0YFOziZq+alBLczsgXdVYHO2ksT3Dv7Mzh0SGsD9d2z04P1iVvbU4303OpizEhHZbC7XnSARQkRUZ6PtjRUTIz2JWTA29j0Zw9PVuZHJkbbcGmxKUmhCXF+edkJ40PNwtnu/wdN5hJR+57OxgAAAABJRU5ErkJggg==`;
                temp.filename = 'test.png';
                temp.type = 'file_open';
                ws.send(JSON.stringify(temp));
                */
            }
            else {
                console.log('other');
            };
            //console.log('tmp',tmp.data.insert)
            //ws.send('Server received');
        });

        ws.on('close', function close() {
            sdServerWSConfig.inProcessing = false;
            console.log(req.socket.remoteAddress, new Date(), 'Replication: disconnected');
            skudLogger(debugFileLog, "Replication: WS disconnect event. Remote host disconnected: " + req.socket.remoteAddress, fs);
            sdServerWSConfig.isConnect = false;

            pgClient.end();
            ws.terminate();
        });
        ws.on('error', (error) => {
            replicationWSConfig.inProcessing = false;
            console.log('\x1b[31m%s\x1b[0m', "Replication: WebSocket ERROR: " + error);
            skudLogger(debugFileLog, "Replication: WebSocket ERROR: " + error, fs);

            pgClient.end();
            ws.terminate();
        });

        //manage replication & tests
        process.stdin.on('keypress', async (str, key) => {
            if (ws.readyState === WebSocket.OPEN) {
                switch (key.name) {
                    case '4':

                        break;
                };
            };
        });

    });

    //PG error handling
    client.on('error', async (e) => {
        if (e.code == 'ECONNRESET') {
            skudLogger(debugFileLog, "PostgreSql ECONNRESET: Connection reset from server DB. Error: " + e, fs);
        }
    });

    client.on('error', async (e) => {
        skudLogger(debugFileLog, "PostgreSql ERROR: " + e, fs);
    })


})();

const heartbeat = (ws) => {  //ping-pong for ws
    ws.isAlive = true;
    //console.log('heartbeat');
    //console.log('heartbeat', this.clients.forEach(async function each(ws) { console.log('each',ws.isAlive)}))
};

const testPing = () => {  //ping-pong for ws
    //console.log('Ping sent');
};


const replicationInterval = setInterval(function ping() {
    sdServerWSConfig.connect.clients.forEach(async function each(ws) {
        if (ws.isAlive === false) {
            ws.terminate();
            console.log('terminated ws')
            return;
        };
        ws.isAlive = false;
        ws.ping(testPing);
    });
}, 8500);

//App tracing for warnings and errors
process.on('warning', (e) => {
	console.warn("Warning:",e.stack);
	skudLogger(debugFileLog,"NodeJS Warning: "+e.stack,fs);
});
process.on('error', (e) => {
	console.warn("Process.on error - error:",e.stack);
	skudLogger(debugFileLog,"NodeJS Error: "+e.stack,fs);
});
process.on('exit', (code) => {
	console.warn("Exit code: ",code);
	skudLogger(debugFileLog,"NodeJS Exit App event. Exit code: "+code,fs);
});
process.on('uncaughtException', (e) => {
	console.warn("Error, uncaughtException: ",e.stack);
	skudLogger(debugFileLog,"UncaughtException event. Error: "+e,fs);
});