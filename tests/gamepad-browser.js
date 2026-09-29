import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
  const page=await browser.newPage();
  await page.addInitScript(()=> {
    window.fakePad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],
      buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
    window.padConnected=true;
    Object.defineProperty(navigator,'getGamepads',{value:()=>window.padConnected?[window.fakePad]:[]});
  });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3000');
  await page.waitForFunction(()=>document.querySelector('#controller-status').textContent.includes('connected'));
  await page.evaluate(async()=> {
    const {InputController}=await import('/js/input.js');
    window.padInput=new InputController(document.querySelector('#preview'));
    window.padInput.active=true;
    window.player={x:100,y:100,aim:0,alive:true};
    window.padInput.read(window.player);
  });
  const read=()=>page.evaluate(()=>window.padInput.read(window.player));
  await page.evaluate(()=>window.fakePad.axes=[1,0,0,1]);
  assert.equal((await read()).x,1);
  assert.equal((await read()).aim,Math.PI/2);
  await page.evaluate(()=>{window.fakePad.axes=[0,0,0,0];window.fakePad.buttons[3].pressed=true;});
  assert.equal((await read()).throw,false);
  await page.waitForTimeout(950);
  assert.equal(await page.evaluate(()=>window.padInput.previewRange()),630);
  await page.evaluate(()=>window.fakePad.buttons[3].pressed=false);
  const thrown=await read();
  assert.equal(thrown.throw,true);assert.equal(thrown.range,630);
  await page.evaluate(()=>window.fakePad.buttons[2].pressed=true);
  const action=await read();
  assert.equal(action.strike,true);
  assert.equal(action.retrieve,false);
  await page.evaluate(()=>window.fakePad.buttons[2].pressed=false);await read();
  await page.keyboard.press('KeyE');
  assert.equal((await read()).retrieve,true);
  assert.equal((await read()).retrieve,false);
  await page.keyboard.down('KeyD');
  assert.equal((await read()).x,1);
  await page.keyboard.up('KeyD');
  await page.evaluate(()=>window.fakePad.buttons[3].pressed=true);await read();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal((await read()).throw,false);
  await page.evaluate(()=>{window.fakePad.buttons[3].pressed=false;window.dispatchEvent(new Event('focus'));});
  assert.equal((await read()).throw,false);
  await page.evaluate(()=>window.padConnected=false);
  assert.equal((await read()).x,0);
  await page.waitForFunction(()=>document.querySelector('#controller-status').textContent.includes('connect by'));
  console.log('Gamepad browser checks passed: detection, sticks, charge/release, strike, keyboard fallback, blur and disconnect.');
} finally {await browser.close();}
