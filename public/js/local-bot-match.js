export function localBotMatch(players, id) {
  return Array.isArray(players)
    && players.some(player => player.id === id)
    && players.every(player => player.bot || player.id === id);
}
