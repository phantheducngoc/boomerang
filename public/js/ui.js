import { CHARACTERS } from '/shared/config.js';
export const $=id=>document.getElementById(id);
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let toastTimer;
export function toast(message) {
  $('toast').textContent=message;
  $('toast').hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('toast').hidden=true,4200);
}
export function showScreen(screen) {
  ['home','room-screen','game-screen'].forEach(id=>$(id).hidden=id!==screen);
  window.scrollTo(0,0);
}
export function renderLobby(room, id) {
  $('copy-code').innerHTML=`${escapeHTML(room.code)} <span>⧉</span>`;
  $('room-players').innerHTML=room.players.map(player=> {
    const character=CHARACTERS.find(item=>item.id===player.character) || CHARACTERS[0];
    return `<div class="room-player"><div class="avatar-dot" style="background:${character.color}">•ᴗ•</div><strong>${escapeHTML(player.name)}${player.id===id?' (you)':''}</strong><small>${player.id===room.host?'ROOM HOST':'READY TO RUMBLE'}</small></div>`;
  }).join('');
  const host=room.host===id;
  $('start-button').disabled=!host || room.players.length<2;
  $('start-button').textContent=host?'Let it fly →':'Waiting for the host…';
  $('room-status').textContent=`${room.players.length} / 6 legends here · ${room.players.length<2?'Invite a friend to start.':'First to 5 round wins.'}`;
}

export function renderHUD(state,id,host) {
  $('scoreboard').innerHTML=state.players.map(player=> {
    const character=CHARACTERS.find(item=>item.id===player.character)||CHARACTERS[0];
    return `<div class="score-pill ${player.id===id?'mine':''} ${player.alive?'':'out'}"><i style="background:${character.color}"></i><span>${escapeHTML(player.name)}</span><strong>${player.score}</strong></div>`;
  }).join('');
  $('round-label').textContent=`ROUND ${state.round}`;
  $('timer').textContent=state.phase==='playing'?Math.max(0,Math.ceil(state.remaining)):'—';
  const winner=state.players.find(player=>player.id===state.winner);
  const mine=state.players.find(player=>player.id===id);
  let overlay='';
  if (state.phase==='countdown') overlay=`<span class="count">${Math.max(1,Math.ceil(state.remaining))}</span><small>ROUND ${state.round} · GET READY TO LET IT FLY</small>`;
  if (state.phase==='roundOver') overlay=`${winner?escapeHTML(winner.name)+' takes it!':'A garden stalemate.'}<small>NEXT ROUND IN ${Math.max(1,Math.ceil(state.remaining))}</small>`;
  if (state.phase==='finished') overlay=`✳ ${escapeHTML(winner?.name || 'A legend')} wins!<small>FIVE WINS. ALL THE BRAGGING RIGHTS.</small>`;
  $('round-overlay').innerHTML=overlay;
  $('result-actions').hidden=state.phase!=='finished';
  $('rematch-button').disabled=!host;
  $('rematch-button').textContent=host?'One more match? ↗':'Waiting for host to rematch…';
  $('strike-ready').textContent=mine?.strikeCooldown>0?`${mine.strikeCooldown.toFixed(1)}s`:'READY';
  $('dash-ready').textContent=mine?.dashCooldown>0?`${mine.dashCooldown.toFixed(1)}s`:'READY';
  if (state.events.length) $('kill-feed').textContent=state.events.at(-1).text;
  else if (state.phase==='countdown') $('kill-feed').textContent='';
  else if (!mine?.alive && state.phase==='playing') $('kill-feed').textContent='You’re out this round. Your comeback is coming.';
}
