
class Player {
	constructor(nickname) {
	this.nickname = nickname;
	this.joinedRoom = null;
	this.opponents = null;
	this.ws = null;
	}

	getNickname() {
		return this.nickname;
	};

	setOpponent(player) {
		this.opponents = player;
	}

	getOpponent() {
		return this.opponents;
	}

	unsetOpponent() {
		this.opponents = null;
	}
}

module.exports = Player;
