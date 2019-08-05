
class PlayRoom {
	constructor(name) {
		this.roomSize = 2;
		this.name = name;
		this.players = [];

		this.result = [0,0];
		this.hand = [-1,-1];
	}

	calResult() {
		if (this.hand[0] == 0 && this.hand[1] == 1) {
			this.result[1] += 1;
		} else if (hand[0] == 1 && this.hand[1] == 0) {
			this.result[0] += 1;
		} else if (hand[0] == 1 && this.hand[1] == 2) {
			this.result[1] += 1;
		} else if (hand[0] == 2 && this.hand[1] == 1) {
			this.result[0] += 1;
		} else if (hand[0] == 2 && this.hand[1] == 0) {
			this.result[1] += 1;
		} else if (hand[0] == 0 && this.hand[1] == 2) {
			this.result[0] += 1;
		}
	}

	getRoomName() {
		return this.name;
	}

	joinRoom(player) {
		if (this.isFull()) return false;

		this.players.push(player);
		player.joinedRoom = this;

		if (Object.entries(this.players).length > 1) {
			player.setOpponent(this.players[0]);
			this.players[0].setOpponent(player);
			return Object.entries(this.players).length;
		}

		return Object.entries(this.players).length;
	};
	
	leaveRoom(player) {
		player.joinedRoom = [];
		this.players.splice(this.players.indexOf(this.player) - 1,1);
	};
	
	inRoom(player)  {
		return this.players.indexOf(this.player) - 1;
	};
	
	playerList() {
		return this.players;
	}

	isEmpty() {
//		console.log(Object.entries(this.players).length);
		if (Object.entries(this.players).length == 0) return true;
		else return false;
	}

	isFull() {
//		console.log(Object.entries(this.players).length);
		if (Object.entries(this.players).length >= this.roomSize) return true;
		else return false;
	}
}

module.exports = PlayRoom;
