import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomService } from '../server/rooms.js';
import { input, profile } from '../server/validation.js';

function fixture() {
  const messages=[];
  const rooms=new RoomService((client,message)=>messages.push({id:client.id,...message}));
  const host={id:'host'};
  rooms.handle(host,{type:'create',name:'Host',character:'mint'});
  return {rooms,host,messages,code:host.room};
}

test('room creation, join, authorization, and player limits',()=> {
  const {rooms,host,code}=fixture();
  assert.match(code,/^[A-Z2-9]{5}$/);
  assert.throws(()=>rooms.handle(host,{type:'start'}),/Invite/);
  const guest={id:'guest'};
  rooms.handle(guest,{type:'join',code});
  assert.throws(()=>rooms.handle(guest,{type:'start'}),/host/);
  for (let i=0;i<4;i++) rooms.handle({id:`extra${i}`},{type:'join',code});
  assert.throws(()=>rooms.handle({id:'overflow'},{type:'join',code}),/full/);
  rooms.handle(host,{type:'start'});
  assert.equal(rooms.rooms.get(code).game.phase,'countdown');
  assert.throws(()=>rooms.handle(host,{type:'start'}),/already/);
  assert.throws(()=>rooms.handle({id:'late'},{type:'join',code}),/started/);
});

test('disconnect cancels a match, transfers host, and cleans up empty rooms',()=> {
  const {rooms,host,code,messages}=fixture();
  const guest={id:'guest'};
  rooms.handle(guest,{type:'join',code});
  rooms.handle(host,{type:'start'});
  rooms.leave(host);
  assert.equal(rooms.rooms.get(code).host,'guest');
  assert.equal(rooms.rooms.get(code).game,null);
  assert.equal(messages.at(-1).type,'lobby');
  rooms.leave(guest);
  assert.equal(rooms.rooms.size,0);
});

test('server rejects invalid input, clamps speed, and prevents stuck movement',()=> {
  assert.equal(input({x:Infinity,y:0,aim:0}),null);
  assert.equal(input({x:'1',y:0,aim:0}),null);
  assert.deepEqual(input({x:100,y:-100,aim:0,throw:'true'}),{x:1,y:-1,aim:0,throw:false,dash:false,strike:false,retrieve:false,recall:false,charging:false,range:180,sequence:0});
  assert.equal(profile({name:'x'.repeat(100),character:'unknown'}).name.length,18);
  assert.equal(profile({character:'unknown'}).character,'mint');
  const {rooms,host,code}=fixture();
  rooms.handle({id:'guest'},{type:'join',code});
  rooms.handle(host,{type:'start'});
  rooms.handle(host,{type:'input',x:1,y:0,aim:0,throw:true});
  const member=rooms.rooms.get(code).members.get(host.id);
  member.lastInput=0;
  rooms.tick(1/30);
  assert.equal(member.player.input.x,0);
  assert.equal(member.player.input.throw,false);
});

test('the host can fill a multiplayer room with bots',()=> {
  const {rooms,host,code,messages}=fixture();
  const guest={id:'guest'};
  rooms.handle(guest,{type:'join',code,name:'Guest',character:'peach'});
  assert.throws(()=>rooms.handle(guest,{type:'add-bot',difficulty:'hard'}),/host/);
  rooms.handle(host,{type:'add-bot',difficulty:'hard'});
  rooms.handle(host,{type:'add-bot',difficulty:'nope'});
  const lobby=messages.at(-1);
  assert.equal(lobby.bots.length,2);
  assert.equal(lobby.bots[0].difficulty,'hard');
  assert.equal(lobby.bots[1].difficulty,'medium');
  assert.equal(lobby.bots[0].character!=='mint' && lobby.bots[0].character!=='peach',true);
  rooms.handle(host,{type:'remove-bot',id:lobby.bots[1].id});
  rooms.handle(host,{type:'start'});
  const game=rooms.rooms.get(code).game;
  assert.equal(game.players.length,3);
  assert.equal(game.players.filter(player=>player.bot).length,1);
  assert.throws(()=>rooms.handle(host,{type:'add-bot'}),/before the match/);
  game.phase='playing';
  game.remaining=50;
  rooms.tick(1/30);
  const bot=game.players.find(player=>player.bot);
  assert.ok(bot.input.x || bot.input.y);
});

test('bots count toward the six-player room limit',()=> {
  const {rooms,host,code}=fixture();
  for (let i=0;i<5;i++) rooms.handle(host,{type:'add-bot',difficulty:'easy'});
  assert.throws(()=>rooms.handle(host,{type:'add-bot'}),/full/);
  assert.throws(()=>rooms.handle({id:'guest'},{type:'join',code}),/full/);
  rooms.handle(host,{type:'remove-bot',id:'bot1'});
  rooms.handle({id:'guest'},{type:'join',code,name:'Guest',character:'gold'});
  assert.equal(rooms.rooms.get(code).members.size+rooms.rooms.get(code).bots.length,6);
});

test('each input moves the player once and a later stop is not overwritten',()=> {
  const {rooms,host,code}=fixture();
  rooms.handle({id:'guest'},{type:'join',code});
  rooms.handle(host,{type:'start'});
  const game=rooms.rooms.get(code).game;
  game.phase='playing';
  game.remaining=50;
  rooms.handle(host,{type:'input',x:1,y:0,aim:0,throw:true,sequence:4});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,throw:false,sequence:5});
  const member=rooms.rooms.get(code).members.get(host.id);
  const start=member.player.x;
  rooms.tick(1/30);
  assert.equal(member.player.inputSequence,4);
  assert.ok(member.player.x>start);
  const moved=member.player.x;
  rooms.tick(1/30);
  assert.equal(member.player.inputSequence,5);
  assert.equal(member.player.x,moved);
  rooms.tick(1/30);
  assert.equal(member.player.inputSequence,5);
  assert.equal(member.player.x,moved);
});
