import test from 'node:test';
import assert from 'node:assert/strict';
import { updateRecall } from '../shared/recall-physics.js';
import { collides } from '../shared/physics.js';

test('pulls above twenty degrees keep sliding around cover until caught',()=> {
  const owner={x:400,y:170,input:{recall:true}};
  const weapon={x:250,y:225,speed:35,recalling:true};
  let active=true;
  for (let i=0;i<900 && active;i++) {
    active=updateRecall(weapon,owner,1/180);
    assert.equal(collides(weapon.x,weapon.y,20),false);
  }
  assert.equal(active,false);
});

test('recall waits before moving and releasing during windup cancels it',()=> {
  const owner={x:700,y:120,input:{recall:true}};
  const weapon={x:400,y:120,angle:1,mode:'grounded',recalling:true,recallWindup:0.2,speed:35};
  updateRecall(weapon,owner,0.1);
  assert.equal(weapon.x,400);
  assert.equal(weapon.angle,1);
  assert.equal(weapon.mode,'grounded');
  updateRecall(weapon,owner,0.15);
  assert.ok(weapon.x>400);
  assert.equal(weapon.mode,'flying');
  weapon.recallWindup=0.2;
  owner.input.recall=false;
  updateRecall(weapon,owner,0.01);
  assert.equal(weapon.recalling,false);
  assert.equal(weapon.recallWindup,0);
});

test('recall starts slow and accelerates toward the owner',()=> {
  const owner={x:700,y:120,input:{recall:true}};
  const weapon={x:400,y:120,speed:35,recalling:true};
  updateRecall(weapon,owner,0.05);
  const first=weapon.x-400;
  const x=weapon.x;
  updateRecall(weapon,owner,0.05);
  assert.ok(weapon.x-x>first);
  assert.ok(weapon.speed>35);
});

test('angled pulls slide along cover, with stronger sideways angles moving farther',()=> {
  const movements=[];
  for (const targetY of [225,205,160]) {
    const owner={x:400,y:targetY,input:{recall:true}};
    const weapon={x:250,y:225,speed:35,recalling:true};
    for (let i=0;i<18;i++) {
      updateRecall(weapon,owner,1/180);
      assert.equal(collides(weapon.x,weapon.y,20),false);
    }
    movements.push(225-weapon.y);
  }
  assert.equal(movements[0],0);
  assert.ok(movements[1]>0);
  assert.ok(movements[2]>movements[1]);
});

test('an angled pull clears the edge and returns without crossing cover',()=> {
  const owner={x:420,y:120,input:{recall:true}};
  const weapon={x:250,y:225,speed:35,recalling:true};
  let active=true;
  for (let i=0;i<720 && active;i++) {
    active=updateRecall(weapon,owner,1/180);
    assert.equal(collides(weapon.x,weapon.y,20),false);
  }
  assert.equal(active,false);
});

test('blocked recall stays still while held and stops pulling on release',()=> {
  const owner={x:400,y:225,input:{recall:true}};
  const weapon={x:250,y:225,speed:35,recalling:true};
  for (let i=0;i<100;i++) updateRecall(weapon,owner,1/180);
  assert.equal(weapon.x,250);
  assert.equal(weapon.blocked,true);
  assert.equal(weapon.recalling,true);
  owner.input.recall=false;
  updateRecall(weapon,owner,1/180);
  assert.equal(weapon.recalling,false);
  assert.equal(weapon.mode,'grounded');
});

test('holding against cover builds pull speed, while release resets the buildup',()=> {
  const owner={x:400,y:225,input:{recall:true}};
  const weapon={x:250,y:225,speed:35,recalling:true};
  for (let i=0;i<180;i++) updateRecall(weapon,owner,1/180);
  assert.equal(weapon.x,250);
  assert.ok(weapon.pullTime>0.99);
  owner.y=120;
  updateRecall(weapon,owner,1/180);
  const chargedMovement=225-weapon.y;
  const fresh={x:250,y:225,speed:35,recalling:true,pullTime:0};
  updateRecall(fresh,owner,1/180);
  assert.ok(chargedMovement>225-fresh.y);
  owner.input.recall=false;
  updateRecall(weapon,owner,1/180);
  assert.equal(weapon.pullTime,0);
  assert.equal(weapon.speed,0);
});
