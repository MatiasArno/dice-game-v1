const EXPRESS = require("express");
const JSONFILE = require("jsonfile");
const RELOAD = require("reload"); 

const APP = EXPRESS();

//EXPRESS SETTINGS

APP.set('appName', "EXPO MURTEN APP");
APP.set('port', 7200);
APP.set('view engine', 'pug');

//MIDDLEWARES

APP.use(EXPRESS.static('public'));
APP.use(EXPRESS.json());

//ROUTES

APP.get('/', (req, res) => {
    
    console.log("GET REQUEST RECEIVED");

    const DATA = JSONFILE.readFileSync("./data.json");
    res.render('index.pug', { result: DATA.result, player: DATA.player, robot: DATA.robot, actualNumber: DATA.actualNumber });
});

APP.post('/', (req, res) => {

    res.send("POST REQUEST RECEIVED");

    const DATA_OBJ = {

        "player": req.body.player,
        "robot": req.body.robot
    }

    JSONFILE.writeFileSync("./data.json", DATA_OBJ);
});

APP.listen(APP.get('port'), () => {
    
    console.log("HTTP Server listening on port:", APP.get('port'));
});


//AUTOMATIC BROWSER REFRESH WITH RELOAD

const HTTP = require("http");

const RELOAD_SERVER = HTTP.createServer(APP);

RELOAD(APP).then( (reloadReturned) => {

    RELOAD_SERVER.listen( 7202, () => console.log("RELOAD Web server listening on port:", 7202) );

}).catch( (error) => console.error("Reload couldn't start. Server couldn't start", error) );


//TCP IP SERVER --- RECIBE LOS DATOS POR SOCKET TCP/IP DE LA CÁMARA COGNEX.

const NET = require("net");

const TCPIP_SERVER = NET.createServer();

function objectMaker(data) {    //CREA EL OBJETO RESPUESTA. Cada jugador tira 3 veces. 

    const DATA = JSONFILE.readFileSync("./data.json");

    if(parseInt(data) == 0) {   //CUANDO SACA FOTO AL TABLERO VACÍO, RESETEÁ EL JUEGO.

        return {
            "player": 0,
            "robot": 0,
            "counter": 0,
            "result": "¡JUGA CON EL ROBOT!",
            "actualNumber": 0
        }
    }

    if(DATA.counter <= 5) {

        if(DATA.counter % 2 == 0) {                 //TURNO DE LA PERSONA       

            return {
                "player": DATA.player += parseInt(data),
                "robot": DATA.robot,
                "counter": DATA.counter + 1,
                "result": "¡JUGA CON EL ROBOT!",
                "actualNumber": parseInt(data)
            }

        } else if(DATA.counter % 2 != 0) {          //TURNO DEL ROBOT

            if(DATA.player > DATA.robot + parseInt(data) && DATA.counter == 5) {

                return {
                    "player": DATA.player,
                    "robot": DATA.robot + parseInt(data),
                    "counter": 0,
                    "result": "¡GANASTE!",
                    "actualNumber": parseInt(data)
                }

            } else if(DATA.player < DATA.robot + parseInt(data) && DATA.counter == 5) {

                return {
                    "player": DATA.player,
                    "robot": DATA.robot + parseInt(data),
                    "counter": 0,
                    "result": "¡PERDISTE!",
                    "actualNumber": parseInt(data)
                }

            } else if(DATA.player == DATA.robot + parseInt(data) && DATA.counter == 5) {

                return {
                    "player": DATA.player,
                    "robot": DATA.robot + parseInt(data),
                    "counter": 0,
                    "result": "¡EMPATE!",
                    "actualNumber": parseInt(data)
                }

            } else {

                return {
                    "player": DATA.player,
                    "robot": DATA.robot += parseInt(data),
                    "counter": DATA.counter + 1,
                    "result": "¡JUGA CON EL ROBOT!",
                    "actualNumber": parseInt(data)
                }
            }
        }
    }
}

TCPIP_SERVER.on('connection', (socket) => { 

    socket.on('data', (data) => {
        
        const DATA_OBJ = objectMaker(data);

        JSONFILE.writeFileSync("./data.json", DATA_OBJ);

        console.log(` Mensaje recibido desde el cliente: ${parseInt(data)}`);
        socket.write(`Mensaje: "${data}" RECIBIDO!`);
    });

    socket.on('close', () => {

        console.log("Connection ended.");
    });

    socket.on('error', (error) => {

        console.log(error.message);
    });
});

TCPIP_SERVER.listen(7201, () => {

    console.log("TCPIP Server listening on port:", TCPIP_SERVER.address().port);
});

