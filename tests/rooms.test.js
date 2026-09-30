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

test('actions survive multiple input messages between server ticks',()=> {
  const {rooms,host,code}=fixture();
  rooms.handle({id:'guest'},{type:'join',code});
  rooms.handle(host,{type:'start'});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,throw:true,sequence:4});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,throw:false,sequence:5});
  const member=rooms.rooms.get(code).members.get(host.id);
  assert.equal(member.player.input.throw,true);
  rooms.tick(1/30);
  assert.equal(member.player.inputSequence,5);
});
