import {
  createCard,
  deleteCard,
  getCards,
  getPlayers,
  deletePlayer,
  inHandCardUpdate,
  createTopCard,
  getTopCard,
  getRandomCardFromDeck,
  getGame,
  updateGame,
  initGame,
  updateCard,
} from "./api.js";

import { fetchAndDrawTable } from "./table.js";

export async function handleInitGame(uniqid) {
  await initGame();

  const players = await getPlayers();
  const drawPromises = players.map(async (player) => {
    for (let i = 0; i < 7; ++i)
      await drawCard(player._id); // Wait for each card to be drawn
  });
  await Promise.all(drawPromises);
  await fetchAndDrawTable();
  await drawDeckTable();
}

export async function drawDeckTable() {
  const game = await getGame();
  const players = await getPlayers();

  //console.log('current',game)

  const turn = document.getElementById("player-turn");
  turn.textContent = `current player turn: ${players[game.playerTurn].name} id : ${uniqid}`;

  const direct = document.getElementById("game-direction");
  if (game.gameDirection == 1) {
    direct.textContent = `game direction: clockwise`;
  } else {
    direct.textContent = `game direction: counter-clockwise`;
  }

  //gamedeck

  const deckCountElement = document.getElementById("deck-count");
  const previousCount = parseInt(deckCountElement.dataset.count) || 0;

  game.gameDeck.sort((a, b) => {
    if (a.color < b.color) return -1;
    if (a.color > b.color) return 1;

    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;

    return 0;
  });

  if (game.gameDeck.length !== previousCount) {
    deckCountElement.textContent = `Number of cards in the deck: ${game.gameDeck.length}`;
    deckCountElement.dataset.count = game.gameDeck.length;
  }

  const table = document.getElementById("deck-table");
  table.innerHTML = "";

  game.gameDeck.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.textContent = `${card.value} - ${card.color}`;
    table.appendChild(cardElement);
  });

  // Used deck
  const usedCountElement = document.getElementById("used-count");
  const previousCount1 = parseInt(usedCountElement.dataset.count) || 0;

  game.usedDeck.sort((a, b) => {
    if (a.color < b.color) return -1;
    if (a.color > b.color) return 1;

    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;

    return 0;
  });

  if (game.usedDeck.length !== previousCount1) {
    usedCountElement.textContent = `Number of used card: ${game.usedDeck.length}`;
    usedCountElement.dataset.count = game.usedDeck.length;
  }

  const table1 = document.getElementById("used-table");
  table1.innerHTML = "";

  game.usedDeck.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.textContent = `${card.value} - ${card.color}`;
    table1.appendChild(cardElement); // Append to table1, not table
  });
}

async function drawCard(playerid) {
  const card = await getRandomCardFromDeck();
  card.playername = "a";
  card.playerid = playerid;
  //console.log(card);
  await createCard(card);
}

export async function handlePlayCard(color, card) {
  // logic not fully implement

  const players = await getPlayers();
  const game = await getGame();
  const ti = players.findIndex((player) => player._id == card.playerid);

  if (players[ti]._id != players[game.playerTurn]._id) {
    alert("wrong turn");
    return;
  }
  console.log(card);
  if (game.isPlayed == true) {
    alert("already played");
    return;
  }
  const topCard = await getTopCard();
  console.log(topCard);
  if (
    topCard != null &&
    card.color != topCard.color &&
    card.color != "wild" &&
    card.value != topCard.value &&
    topCard.color != "wild"
  ) {
    //if (card.color)
    alert("invalid move");
    return;
  }

  card.color = color;
  await updateCard(card);

  const cards = await getCards();

  if (card.value == "draw2") {
    const index =
      players.findIndex((player) => player._id == card.playerid) +
      game.gameDirection;
    if (index == players.length) {
      index = 0;
    } else if (index == -1) {
      index = players.length - 1;
    }
    const id = players[index]._id;
    for (let i = 0; i < 2; ++i) {
      drawCard(id);
    }
  } else if (card.value == "reverse") {
    if (game.gameDirection == 1) {
      game.gameDirection = -1;
    } else {
      game.gameDirection = 1;
    }
  } else if (card.value == "skip") {
    // game.playerTurn += game.gameDirection;
    // if (game.playerTurn >= players.length) {
    //   game.playerTurn -= players.length;
    // } else if (game.playerTurn < 0) {
    //   game.playerTurn += players.length;
    // }
    game.isSkip = true;
  } else if (card.value == "wild4") {
    const index =
      players.findIndex((player) => player._id == card.playerid) +
      game.gameDirection;
    //console.log("iddd", index);
    if (index == players.length) {
      index = 0;
    } else if (index == -1) {
      index = players.length - 1;
    }

    const id = players[index]._id;

    for (let i = 0; i < 4; ++i) {
      drawCard(id);
    }
  }

  game.usedDeck.push(card);
  //console.log("player card leght", players[game.playerTurn].cards.length);
  if (players[game.playerTurn].cards.length == 2) {
    game.isPress = true;
  }

  game.isPlayed = true;

  if (players[game.playerTurn].cards.length == 1) {
    endGame();
  }
  // game.playerTurn += game.gameDirection;
  // if (game.playerTurn >= players.length) {
  //   game.playerTurn -= players.length;
  // } else if (game.playerTurn < 0) {
  //   game.playerTurn += players.length;
  // }

  await updateGame(game);

  // const game1 = await getGame();
  // console.log(game);
  // console.log(game1);

  await createTopCard(card._id);
  await deleteCard(card._id);
  await fetchAndDrawTable();
  await drawDeckTable();
}

// export async function handleDeleteCard(id) {
//   // just delete in items and in player's hand we update every times when we fetchanddraw()

//   await createTopCard(id);
//   await deleteCard(id);
//   await fetchAndDrawTable();
// }
export async function endTurn() {
  const game = await getGame();
  const players = await getPlayers();

  console.log("ending turn",game);
  //console.log(game.isPlayed === false, game.isDraw === false);

  if (game.isPlayed === false && game.isDraw === false) {
    alert("must play or draw first");
    return;
  }

  if (!(game.isPlayed === false || game.isDraw === false)) {
    alert("must play or draw first");
    return;
  }

  if (game.isPress == true) {
    const tid = players[game.playerTurn]._id;
    game.pressedTime.sort((a, b) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;

      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;

      return 0;
    });
    //console.log(game.pressedTime);
    const tin = game.pressedTime.findIndex((a) => a.id == tid);
    if (tin != 0) {
      drawCard(tid);
      drawCard(tid);
    }
    game.pressedTime = [];
  }

  game.playerTurn += game.gameDirection;
  if (game.playerTurn >= players.length) {
    game.playerTurn -= players.length;
  } else if (game.playerTurn < 0) {
    game.playerTurn += players.length;
  }

  if (game.isSkip == true) {
    game.playerTurn += game.gameDirection;
    if (game.playerTurn >= players.length) {
      game.playerTurn -= players.length;
    } else if (game.playerTurn < 0) {
      game.playerTurn += players.length;
    }
  }

  game.isSkip = false;
  game.isPlayed = false;
  game.isPress = false;
  game.isDraw = false;
  await updateGame(game);
  await drawDeckTable();
}

export async function handleUno(id, date) {
  const game = await getGame();
  const players = await getPlayers();
  if (game.isPress == true) {
    //console.log("player date", id, date);
    let a = {};
    a.id = id;
    a.date = date;
    game.pressedTime.push(a);
  } else {
    alert("now is not the time");
    return;
  }
  await drawDeckTable();
  await updateGame(game);
}

export async function endGame() {
  const res = document.getElementById("game-res");
  res.textContent = `the winner is: ${players[game.playerTurn].name}`;
}