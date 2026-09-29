import { ellipse, rounded, line } from './shapes.js';

function path(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function avocado(ctx, back) {
  ctx.beginPath();
  ctx.moveTo(0, -53);
  ctx.bezierCurveTo(-17, -53, -15, -34, -25, -15);
  ctx.bezierCurveTo(-42, 23, 42, 23, 25, -15);
  ctx.bezierCurveTo(15, -34, 17, -53, 0, -53);
  ctx.fillStyle = '#397346';
  ctx.fill();
  if (back) {
    for (let i = 0; i < 7; i++) ellipse(ctx, Math.sin(i * 2) * 17, -35 + i * 6, 2, 3, '#588c4d');
    return;
  }
  ctx.save();
  ctx.translate(0, -3);
  ctx.scale(0.83, 0.86);
  ctx.beginPath();
  ctx.moveTo(0, -53);
  ctx.bezierCurveTo(-17, -53, -15, -34, -25, -15);
  ctx.bezierCurveTo(-42, 23, 42, 23, 25, -15);
  ctx.bezierCurveTo(15, -34, 17, -53, 0, -53);
  ctx.fillStyle = '#c3e77f';
  ctx.fill();
  ctx.restore();
  ellipse(ctx, 0, -3, 15, 16, '#97613c');
  ellipse(ctx, -4, -7, 8, 9, '#bf8c50');
  ellipse(ctx, -7, -36, 4, 7, '#f0f6ae', 0.35);
}

function banana(ctx, back) {
  ctx.beginPath();
  ctx.moveTo(7, -54);
  ctx.bezierCurveTo(34, -35, 23, 9, -6, 14);
  ctx.bezierCurveTo(-24, 17, -29, 5, -24, -8);
  ctx.bezierCurveTo(2, 5, 10, -28, 7, -54);
  ctx.fillStyle = '#edc347';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -47);
  ctx.bezierCurveTo(19, -23, 6, 4, -15, 7);
  ctx.strokeStyle = '#fff0a0';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
  rounded(ctx, 4, -58, 10, 9, 3, '#75603b');
  if (!back) path(ctx, [[13,-26],[31,-9],[24,1],[11,-14]], '#ffe58a');
}

function milk(ctx, back) {
  rounded(ctx, -23, -38, 45, 53, 4, '#dff5f3');
  path(ctx, [[22,-38],[31,-29],[31,10],[22,15]], '#4582aa');
  path(ctx, [[-23,-38],[-12,-51],[13,-51],[22,-38]], '#86cce2');
  path(ctx, [[13,-51],[31,-29],[22,-38]], '#336586');
  rounded(ctx, -12, -55, 25, 6, 2, '#4387b7');
  rounded(ctx, -23, -5, 45, 15, 0, '#65bdd2');
  if (back) {
    for (let i=0; i<4; i++) line(ctx, [[-14,-28+i*6],[13,-28+i*6]], '#81bbc7', 2);
  } else {
    ellipse(ctx, 0, -30, 6, 5, '#fffdf0');
  }
}

function watermelon(ctx, back) {
  ctx.beginPath();
  ctx.moveTo(0,-52);
  ctx.lineTo(33,-4);
  ctx.quadraticCurveTo(0,32,-33,-4);
  ctx.closePath();
  ctx.fillStyle='#39774b';
  ctx.fill();
  if (back) {
    line(ctx, [[-10,-29],[-20,-2],[-10,10]], '#73ab59', 5);
    line(ctx, [[8,-30],[19,-1],[9,11]], '#73ab59', 5);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(0,-47);
  ctx.lineTo(27,-5);
  ctx.quadraticCurveTo(0,20,-27,-5);
  ctx.closePath();
  ctx.fillStyle='#b5df83';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0,-43);
  ctx.lineTo(23,-7);
  ctx.quadraticCurveTo(0,12,-23,-7);
  ctx.closePath();
  ctx.fillStyle='#f16c72';
  ctx.fill();
  for (const [x,y] of [[0,-32],[-10,-19],[11,-20],[-17,-7],[17,-6]]) ellipse(ctx,x,y,1.6,3,'#663b40',x*0.035);
}

function donut(ctx, back) {
  ctx.beginPath();
  ctx.ellipse(0,-18,29,33,0,0,Math.PI*2);
  ctx.ellipse(0,-24,10,12,0,0,Math.PI*2);
  ctx.fillStyle='#d6a260';
  ctx.fill('evenodd');
  if (back) return;
  ctx.beginPath();
  ctx.ellipse(0,-21,26,28,0,0,Math.PI*2);
  ctx.ellipse(0,-24,10,12,0,0,Math.PI*2);
  ctx.fillStyle='#ee8cb8';
  ctx.fill('evenodd');
  const colors=['#fff1ac','#bcdef0','#b16abb'];
  for (let i=0;i<11;i++) {
    const angle=i/11*Math.PI*2;
    const x=Math.cos(angle)*19, y=-23+Math.sin(angle)*21;
    line(ctx,[[x-2,y-1],[x+1,y+2]],colors[i%3],2.5);
  }
}

function sushi(ctx, back) {
  rounded(ctx,-27,-33,54,47,[5,5,18,18],'#294a43');
  line(ctx,[[-19,-20],[-19,1]],'#49675a',3);
  ellipse(ctx,0,-33,27,13,'#edf0dc');
  ellipse(ctx,0,-33,19,8,'#fffbed');
  rounded(ctx,-15,-39,17,11,3,'#ee8974');
  rounded(ctx,3,-38,10,10,2,'#9cbf63');
  line(ctx,[[-11,-37],[-5,-30]],'#ffd4b0',2);
  if (!back) ellipse(ctx,15,-34,3,5,'#e7c56d');
}

const bodies = { mint:avocado, gold:banana, blue:milk, peach:watermelon, rose:donut, lilac:sushi };

export function drawFoodBody(ctx, character, back) {
  ctx.save();
  (bodies[character.id] || avocado)(ctx, back);
  ctx.restore();
}

export function foodFaceOffset(id) {
  return id === 'rose' ? 22 : id === 'gold' ? 5 : 0;
}
