import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';
import { RULES } from '../shared/config.js';

const port=3100+Math.floor(Math.random()*1000);
const server=spawn(process.execPath,['server/index.js'],{
  env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']
});
const ready=new Promise((resolve,reject)=> {
  const timer=setTimeout(()=>reject(new Error('Server startup timed out')),5000);
  server.stdout.once('data',()=> {clearTimeout(timer); resolve();});
  server.once('error',error=> {clearTimeout(timer); reject(error);});
  server.once('exit',code=> {clearTimeout(timer); reject(new Error(`Server exited: ${code}`));});
});

async function connect() {
  const socket=new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const messages=[];
  socket.on('message',raw=>messages.push(JSON.parse(raw.toString())));
  await new Promise((resolve,reject)=> {socket.once('open',resolve); socket.once('error',reject);});
  return {socket,messages,send:message=>socket.send(JSON.stringify(message))};
}
async function until(predicate,timeout=6000) {
  const start=Date.now();
  while (!predicate()) {
    if (Date.now()-start>timeout) throw new Error('Condition timed out');
    await new Promise(resolve=>setTimeout(resolve,15));
  }
}
const latest=client=>client.messages.findLast(message=>message.type==='state')?.state;

test('real WebSockets share authoritative movement and recover after disconnect',async()=> {
  const clients=[];
  try {
    await ready;
    const host=await connect();
    const guest=await connect();
    clients.push(host,guest);
    host.send({type:'create',name:'Host',character:'mint'});
    await until(()=>host.messages.some(message=>message.type==='lobby'));
    const code=host.messages.find(message=>message.type==='lobby').code;
    guest.send({type:'join',name:'Guest',character:'peach',code});
    await until(()=>guest.messages.some(message=>message.type==='lobby'));
    guest.send({type:'start'});
    await until(()=>guest.messages.some(message=>message.type==='error'));
    assert.match(guest.messages.find(message=>message.type==='error').message,/host/);
    host.send({type:'start'});
    await until(()=>latest(host)?.phase==='playing' && latest(guest)?.phase==='playing');
    const before=latest(host).players[0].x;
    host.send({type:'input',x:1000,y:0,aim:0,throw:false,dash:false});
    await until(()=>latest(guest).players[0].x>before+20);
    const after=latest(guest).players[0].x;
    assert.ok(after-before<60,'Server clamps movement speed');
    await until(()=>latest(host).remaining<RULES.roundTime-RULES.boomerangDelay);
    host.send({type:'input',x:0,y:0,aim:0,throw:true,dash:false});
    await until(()=>latest(guest).projectiles.length===1);
    assert.ok(Math.abs(latest(host).players[0].x-latest(guest).players[0].x)<8);
    guest.socket.close();
    await until(()=>host.messages.at(-1)?.type==='lobby');
    assert.equal(host.messages.at(-1).players.length,1);
    assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status,200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/server/index.js`)).status,404);
  } finally {
    for (const client of clients) client.socket.terminate();
    server.kill('SIGTERM');
  }
});
