const WebSocket = require('ws');
const fs = require('fs');
const eps = require('ejs');

const PlayRoom = require('./js/playRoom');
const Player = require('./js/player');

var SERVER_PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


const maxRoom = 2;
let myPlayRoom = {};
let myPlayers = [];

var r;
for (r = 0; r < maxRoom; r++ ) {
  myPlayRoom[r] = new PlayRoom('Room' + r);
}

function showRoomInfo() {
  var r = 0;
  var p = 0;
  console.log("");
  for (r = 0; r < maxRoom; r++ ) {
//    console.log(myPlayRoom[r].getRoomName());
//    console.log("  empty ? " + myPlayRoom[r].isEmpty());
//    console.log("  full ? " + myPlayRoom[r].isFull());
    for (p = 0; p < Object.entries(myPlayRoom[r].playerList()).length; p++) {
      var opponent = myPlayRoom[r].playerList()[p].getOpponent();
      if (opponent === null) console.log("    players " + p + " : " + myPlayRoom[r].playerList()[p].getNickname());
      else console.log("    players " + p + " : " + myPlayRoom[r].playerList()[p].getNickname() + " vs " + myPlayRoom[r].playerList()[p].getOpponent().getNickname());
    }
//    console.log("    players ? " + myPlayRoom[r].playerList());
  }
}

function joinAnyRoom(player) {
  var r=0;
  for (r = 0; r < maxRoom; r++ ) {
    if (myPlayRoom[r].joinRoom(player) > 0) {
      return r;
    }
  }
  console.log("All rooms are full.");
  return false;
}

r = 0;
//showRoomInfo()

//let player1 = new Player('Ada');
//joinAnyRoom(player1);
//showRoomInfo()

//let player2 = new Player('Bob');
//let player3 = new Player('Cat');
//joinAnyRoom(player2);
//joinAnyRoom(player3);
//showRoomInfo()

//myPlayRoom[r].leaveRoom(player2);
//showRoomInfo()

function noop() {}
 
function heartbeat() {
  this.isAlive = true;
  console.log(this.clientName + " is heartbeating...");
  broadcastMsg();
}

function broadcastMsg() {
    // Broadcast to All Clients
    server.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        setTimeout(function timeout() {
          var data = JSON.stringify("Clients.size = " + server.clients.size);
          var msg = `{"tag": "bcClientsSize", "data": ${data}}`;
          client.send(msg);
//          client.send( '{"playlist": ' + JSON.stringify(myPlayRoom.playerList()) + ', "msg": ' + server.clients.size + '}' );
//          client.send( '{playlist: ' + myPlayRoom.playerList() + ', }' + " -> is online" + " (Total " + server.clients.size + " clients)");
        }, 500);
      }
    });
}

//const server = new WebSocket.Server({ port: 3000 });
const server = new WebSocket.Server({ port: SERVER_PORT });


server.on('open', function open() {
    console.log('connected');
//    ws.send(Date.now());
});

server.on('close', function close() {
  console.log('disconnected');
});

server.on('connection', function connection(ws, req) {
//  res.render('index.ejs');
  console.log('connected');
  const ip = req.connection.remoteAddress;
  const port = req.connection.remotePort;
  const clientName = ip + " " +  port;

  ws.clientName = clientName;
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  console.log('%s is connected', clientName)

  // Send to Client
//  ws.send("Welcome " + clientName);

  ws.on('message', function incoming(message) {
		var v = JSON.parse(message);
    console.log("v= " +  v);
    console.log("v.tag= " + v.tag);
    console.log("v.data= " + v.data);

    if (v.tag == "hand") {
      console.log("hand : " + v.data);
      myPlayers.forEach(function(player, index) {
          if(player.ws === ws) {
            var pr = player.joinedRoom;
          if (player === pr.players[0]) {
            player.joinedRoom.hand[0] = v.data;
            if (player.joinedRoom.hand[1] == -1) {
              // wait opponent, do nothing
            } else {
              // cal 
              var res = calResult(player.joinedRoom.hand[0],player.joinedRoom.hand[1]);
              if (res == 0) {
                pr.result[0] += 1;
              }
              if (res == 1) {
                pr.result[1] += 1;
              }
              sendResultToClient(pr);
              player.joinedRoom.hand[0] = -1;
              player.joinedRoom.hand[1] = -1;
            }
          }

          if (player === pr.players[1]) {
            player.joinedRoom.hand[1] = v.data;
            if (player.joinedRoom.hand[0] == -1) {
              // wait opponent, do nothing
            } else {
              // cal 
              var res = calResult(player.joinedRoom.hand[0],player.joinedRoom.hand[1]);
              if (res == 0) {
                pr.result[0] += 1;
              }
              if (res == 1) {
                pr.result[1] += 1;
              }
              sendResultToClient(pr);
              player.joinedRoom.hand[0] = -1;
              player.joinedRoom.hand[1] = -1;
            }
          }


        }        
      });
    }


    if (v.tag == "newGame") {
      v.data.forEach(function(element) {        
//        console.log(element);
        if (element.name == "nickname") {
          var player = new Player(element.value);
          player.ws = ws;
          myPlayers.push(player);
          joinAnyRoom(player);
//          showRoomInfo();
//          console.log(player.getOpponent());
          if (player.getOpponent() !== null) {
            // start game
            console.log("starting game.");
            var pr = player.joinedRoom;
            sendResultToClient(pr);


           

          }
//          console.log(myPlayers);
          console.log('%s start game:  %s', element.value, clientName);
        }
      });
    }
    if(v.tag == "quitGame"){
      myPlayers.forEach(function(player, index) {
        if(player.ws === this) {
          player.joinedRoom.leaveRoom(player);
          player.getOpponent().unsetOpponent();
          delete myPlayers[index];
          myPlayers.splice(index,1);
        }        
      });
    }
//    console.log('received: %s from %s', message, clientName);
    
    // Broadcast to All Clients
    server.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        setTimeout(function timeout() {
//          client.send( clientName + " -> " + message + " (Total " + server.clients.size + " clients)");
        }, 500);
      }
    });

  });

});

function sendResultToClient(pr) {
  console.log("sendResultToClient");
//  var pr = player.joinedRoom;            
  var p0 = pr.players[0];
  var p1 = pr.players[1];
  var n0 = JSON.stringify([pr.players[0].getNickname(),pr.players[1].getNickname()]);
  var n1 = JSON.stringify([pr.players[1].getNickname(),pr.players[0].getNickname()]);
  var r0 = JSON.stringify([pr.result[0],pr.result[1]]); 
  var r1 = JSON.stringify([pr.result[1],pr.result[0]]); 
  var h0 = JSON.stringify([pr.hand[0],pr.hand[1]]); 
  var h1 = JSON.stringify([pr.hand[1],pr.hand[0]]); 
  
  setTimeout(function timeout() {
    var data = JSON.stringify(`{"name" : ${n0},"result" : ${r0},"hand" : ${h0}}`);
    var msg = `{"tag" : "gameReady", "data": ${data}}`;
    p0.ws.send(msg);
  }, 500);            

  setTimeout(function timeout() {
    var data = JSON.stringify(`{"name" : ${n1},"result" : ${r1},"hand" : ${h1}}`);
    var msg = `{"tag" : "gameReady", "data": ${data}}`;
    p1.ws.send(msg);
  }, 500); 
};

const interval = setInterval(function ping() {
  server.clients.forEach(function each(ws) {
    console.log(ws.isAlive);
    console.log(server.clients.size);
    if (ws.isAlive === false) {
      console.log("client connection lost.");
      return ws.terminate();
    }
     
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 5000);

function calResult(hand0,hand1) {
  var result = -1;
	if (hand0 == 0 && hand1 == 1) {
		result = 1;
	} else if (hand0 == 1 && hand1 == 0) {
		result = 0;
	} else if (hand0 == 1 && hand1 == 2) {
		result = 1;
	} else if (hand0 == 2 && hand1 == 1) {
		result = 0;
	} else if (hand0 == 2 && hand1 == 0) {
		result = 1;
	} else if (hand0 == 0 && hand1 == 2) {
		result = 0;
  }
  return result;
}
