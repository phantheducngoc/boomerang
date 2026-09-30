import { CHARACTERS, WORLD } from '/shared/config.js';
import { botLevel } from '/shared/bot-levels.js';
import { ArenaRenderer } from './renderer.js';
import { drawCharacter } from './art/characters.js';
import { RoomConnection } from './network.js';
import { GameSession } from './session.js';
import { GameAudio } from './audio.js';
import { $, toast, showScreen, renderLobby } from './ui.js';

const audio=new GameAudio();
let character='mint';
let room=null;
let busy=false;
const connection=new RoomConnection(onMessage,()=> {
  session.stop();
  room=null;
  showScreen('home');
  toast('Connection lost. Join the room again to continue.');
});
const session=new GameSession(connection,audio);
setInterval(()=> {
  const status=session.input.gamepad.status();
  if ($('controller-status').textContent!==status) $('controller-status').textContent=status;
},500);
const preview=new ArenaRenderer($('preview'),true);
const portrait=$('portrait').getContext('2d');
const sx=WORLD.width/1000, sy=WORLD.height/660;
const previewState={phase:'playing',projectiles:[],events:[],players:[
  {id:'a',name:'Avocado',character:'mint',x:210*sx,y:320*sy,alive:true,aim:0},
  {id:'b',name:'Watermelon',character:'peach',x:762*sx,y:240*sy,alive:true,aim:2},
  {id:'c',name:'Sushi',character:'lilac',x:688*sx,y:490*sy,alive:true,aim:-2},
  {id:'d',name:'Banana',character:'gold',x:390*sx,y:153*sy,alive:true,aim:1}
]};

try {
  const saved=JSON.parse(localStorage.getItem('boomerang-profile')||'null');
  if (saved) {
    $('bot-difficulty').value=botLevel(saved.difficulty);
    $('room-bot-difficulty').value=botLevel(saved.difficulty);
    $('practice-invincible').checked=saved.invincible===true;
    $('player-name').value=String(saved.name||'Player One').slice(0,18);
    if (CHARACTERS.some(item=>item.id===saved.character)) character=saved.character;
  }
} catch { /* Storage may be disabled in a private browser. */ }

function selectCharacter(id) {
  character=id;
  const selected=CHARACTERS.find(item=>item.id===id);
  $('character-name').textContent=selected.name;
  $('character-title').textContent=selected.title;
  $('portrait').setAttribute('aria-label',`${selected.name}: ${selected.title}`);
  document.querySelectorAll('.character-option').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===id)));
}
for (const item of CHARACTERS) {
  const button=document.createElement('button');
  button.className='character-option';
  button.dataset.id=item.id;
  button.style.setProperty('--swatch',item.color);
  button.setAttribute('aria-label',`Choose ${item.name}`);
  button.title=item.name;
  button.addEventListener('click',()=> { selectCharacter(item.id); audio.play('select'); });
  $('characters').append(button);
}
selectCharacter(character);

function profile() {
  const value={name:$('player-name').value.trim()||'Player One',character,
    difficulty:botLevel($('bot-difficulty').value),invincible:$('practice-invincible').checked};
  try { localStorage.setItem('boomerang-profile',JSON.stringify(value)); } catch { /* Optional storage. */ }
  return value;
}

function onMessage(message) {
  if (message.type==='error' || message.type==='notice') { toast(message.message); return; }
  if (message.type==='lobby') {
    session.stop();
    room=message;
    showScreen('room-screen');
    renderLobby(room,connection.id);
  } else if (message.type==='state') session.accept(message.state,room?.host);
}

async function openRoom(type) {
  if (busy) return;
  const code=$('room-code').value.trim().toUpperCase();
  if (type==='join' && !/^[A-Z2-9]{5}$/.test(code)) {
    toast('Enter the five-character room code from your friend.');
    $('room-code').focus();
    return;
  }
  busy=true;
  $('create-button').disabled=true;
  $('join-button').disabled=true;
  try {
    await connection.connect();
    connection.send({type,code,...profile()});
  } catch (error) { toast(error.message); }
  finally {
    busy=false;
    $('create-button').disabled=false;
    $('join-button').disabled=false;
  }
}

function leave() {
  session.stop();
  connection.send({type:'leave'});
  connection.close();
  room=null;
  showScreen('home');
  $('practice-button').focus({preventScroll:true});
}

$('create-button').addEventListener('click',()=>openRoom('create'));
$('join-button').addEventListener('click',()=>openRoom('join'));
$('room-code').addEventListener('keydown',event=> { if (event.key==='Enter') openRoom('join'); });
$('practice-button').addEventListener('click',()=> { connection.close(); session.startPractice(profile()); });
$('leave-room').addEventListener('click',leave);
$('leave-game').addEventListener('click',leave);
$('start-button').addEventListener('click',()=>connection.send({type:'start'}));
$('add-bot').addEventListener('click',()=>connection.send({type:'add-bot',difficulty:botLevel($('room-bot-difficulty').value)}));
$('room-players').addEventListener('click',event=> {
  const button=event.target.closest('[data-bot]');
  if (button) connection.send({type:'remove-bot',id:button.dataset.bot});
});
$('rematch-button').addEventListener('click',()=> {
  if (session.mode==='practice') session.startPractice(profile());
  else connection.send({type:'rematch'});
});
$('copy-code').addEventListener('click',async()=> {
  if (!room) return;
  const link=new URL(location.href);
  link.searchParams.set('room',room.code);
  try { await navigator.clipboard.writeText(link.href); toast('Invite link copied. Send it to your people!'); }
  catch { toast(`Your room code is ${room.code}. Share it with a friend.`); }
});
$('how-button').addEventListener('click',()=> { session.input.reset(); $('help-dialog').showModal(); });
$('close-help').addEventListener('click',()=>$('help-dialog').close());
$('help-dialog').addEventListener('click',event=> { if (event.target===$('help-dialog')) $('help-dialog').close(); });
$('sound-button').addEventListener('click',()=> {
  const enabled=audio.toggle();
  $('sound-button').setAttribute('aria-pressed',String(enabled));
  $('sound-button').setAttribute('aria-label',enabled?'Mute sound':'Enable sound');
  $('sound-button').textContent=enabled?'♪':'♫';
  toast(enabled?'Sound is on. Let it sing.':'Sound is off.');
});

const invited=new URLSearchParams(location.search).get('room');
if (invited) { $('room-code').value=invited.slice(0,5).toUpperCase(); toast('You’re invited! Pick your legend, enter your name, and join.'); }
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function animate(time) {
  if (!$('home').hidden) {
    const seconds=reducedMotion.matches?0:time/1000;
    preview.render(previewState,seconds);
    portrait.clearRect(0,0,360,240);
    drawCharacter(portrait,{x:180,y:157,character,alive:true,aim:.4},seconds,{scale:1.85,weapon:true});
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
