export function hasHeldWeapon(state, player) {
  const away = state.projectiles.filter(weapon => weapon.owner === player.id).length;
  return (player.weaponCount ?? 1) > away;
}
