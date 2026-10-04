import { snapshotDelay } from '../../shared/network-timing.js';

export class RoomConnection {
  constructor(onMessage, onDisconnect) {
    this.onMessage=onMessage;
    this.onDisconnect=onDisconnect;
    this.socket=null;
    this.id=null;
    this.latency=0;
    this.jitter=0;
    this.lastLatency=null;
  }

  async connect() {
    this.close();
    return new Promise((resolve,reject)=> {
      const socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
      this.socket=socket;
      let settled=false;
      const timeout=setTimeout(()=> {
        reject(new Error('Connection timed out. Check your connection and try again.'));
        this.close();
      },6000);
      socket.onmessage=event=> {
        const message=JSON.parse(event.data);
        if (message.type==='welcome') {
          this.id=message.id;
          settled=true;
          clearTimeout(timeout);
          this.heartbeat=setInterval(()=>this.send({type:'ping',at:Date.now()}),2000);
          resolve();
        } else if (message.type==='pong') {
          const sample=Date.now()-message.at;
          if (this.lastLatency!==null) {
            const variation=Math.abs(sample-this.lastLatency);
            this.jitter=this.jitter*.75+variation*.25;
          }
          this.lastLatency=sample;
          this.latency=Math.round(this.latency?this.latency*.75+sample*.25:sample);
        }
        else this.onMessage(message);
      };
      socket.onerror=()=> {
        clearTimeout(timeout);
        if (!settled) reject(new Error('Could not reach the game server. Please try again.'));
      };
      socket.onclose=()=> {
        clearTimeout(timeout);
        clearInterval(this.heartbeat);
        if (!settled) reject(new Error('The connection closed. Please try again.'));
        else this.onDisconnect();
      };
    });
  }

  send(message) {
    if (this.socket?.readyState===WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  interpolationDelay() {
    return snapshotDelay(this.jitter);
  }

  close() {
    clearInterval(this.heartbeat);
    if (this.socket) { this.socket.onclose=null; this.socket.close(); this.socket=null; }
    this.id=null;
    this.latency=0;
    this.lastLatency=null;
    this.jitter=0;
  }
}
