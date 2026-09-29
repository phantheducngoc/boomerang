export function heldWeaponCount(state, player) {
  const away = state.projectiles.filter(weapon => weapon.owner === player.id).length;
  return Math.max(0, (player.weaponCount ?? 1) - away);
}

export function hasHeldWeapon(state, player) {
  return heldWeaponCount(state, player) > 0;
}
