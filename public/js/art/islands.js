import { WORLD } from '/shared/config.js';
import { SHORE } from '/shared/islands.js';
import { ellipse, line } from './shapes.js';

function path(ctx, offsetX = 0, offsetY = 0) {
  ctx.beginPath();
  ctx.moveTo(SHORE[0][0] + offsetX, SHORE[0][1] + offsetY);
  SHORE.slice(1).forEach(([x, y]) => ctx.lineTo(x + offsetX, y + offsetY));
  ctx.closePath();
}

function drawIsland(ctx) {
  path(ctx, 10, 30);
  ctx.fillStyle = '#587ba4';
  ctx.fill();
  path(ctx, 6, 17);
  ctx.fillStyle = '#839fd0';
  ctx.fill();
  const grass = ctx.createLinearGradient(0, 40, WORLD.width, WORLD.height);
  grass.addColorStop(0, '#dcf68a');
  grass.addColorStop(0.55, '#c4ec72');
  grass.addColorStop(1, '#a9d65c');
  path(ctx);
  ctx.fillStyle = grass;
  ctx.fill();
  ctx.save();
  path(ctx);
  ctx.clip();
  ellipse(ctx, 680, 360, 350, 180, '#e8f8a455');
  ellipse(ctx, 1150, 700, 270, 130, '#9dce5540');
  ellipse(ctx, 300, 730, 210, 110, '#e5f5a044');
  for (let i = 0; i < 70; i++) {
    const x = 100 + (i * 193) % 1300;
    const y = 90 + (i * 127) % 800;
    ellipse(ctx, x, y, 2.2, 1.2, i % 3 ? '#86b94d55' : '#f1f7b077');
  }
  ctx.restore();
}

function bamboo(ctx, x, y, height) {
  ctx.save();
  ctx.translate(x, y);
  line(ctx, [[0, 0], [2, -height]], '#6ea25a', 4);
  line(ctx, [[2, -height * 0.45], [16, -height * 0.7]], '#8fbf6a', 2);
  ellipse(ctx, 18, -height * 0.72, 8, 3, '#b7d98a', -0.4);
  ellipse(ctx, -8, -height * 0.82, 7, 3, '#cfe7a2', 0.6);
  ctx.restore();
}

function rock(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  const top=[[-46,-8],[-31,-39],[8,-50],[44,-29],[49,-5],[24,13],[-27,10]];
  ellipse(ctx, 8, 28, 51, 17, '#334f713d');
  crateFace(ctx, [top[6],top[5],[24,34],[-27,31]], '#4e6095');
  crateFace(ctx, [top[5],top[4],[49,16],[24,34]], '#596ca4');
  crateFace(ctx, top, '#798cc7');
  crateFace(ctx, [[-31,-39],[8,-50],[27,-32],[-10,-18]], '#a2afe0');
  line(ctx, [top[6],top[5]], '#435687', 3);
  ctx.restore();
}

function crateFace(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach(point => ctx.lineTo(...point));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function canopy(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ellipse(ctx, 2, 10, 42, 24, '#8f3436');
  [[-28,0,25,24],[-10,-18,29,27],[17,-17,31,27],[34,2,24,22],
    [8,8,34,27],[-22,13,25,20]].forEach(([px,py,rx,ry], index) =>
    ellipse(ctx,px,py,rx,ry,index%3===0?'#b94438':'#ce523e'));
  ellipse(ctx, -8, -19, 22, 13, '#df684b99');
  ellipse(ctx, 22, -11, 17, 10, '#e06a4b77');
  ctx.restore();
}

function tree(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ellipse(ctx, 5, 20, 48, 15, '#34536e35');
  for (let i=0;i<22;i++) {
    const angle=i*2.4;
    ellipse(ctx, 18+Math.cos(angle)*(18+i%5*5), 19+Math.sin(angle)*9,
      3+i%2, 2.2, i%3?'#b94338':'#d65b40', angle);
  }
  ctx.beginPath();
  ctx.moveTo(-12,17); ctx.bezierCurveTo(-7,-18,-8,-57,-3,-83);
  ctx.lineTo(12,-82); ctx.bezierCurveTo(8,-48,15,-14,15,17);
  ctx.closePath(); ctx.fillStyle='#d7d5d2'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(5,-81); ctx.lineTo(14,-82); ctx.lineTo(15,17); ctx.lineTo(6,12);
  ctx.closePath(); ctx.fillStyle='#777a9e'; ctx.fill();
  line(ctx, [[2,-55],[-33,-82]], '#777a9e', 9);
  line(ctx, [[7,-60],[41,-90]], '#777a9e', 9);
  line(ctx, [[-1,-38],[-28,-51]], '#8a7392', 7);
  [[-7,-4,9,4],[5,-19,7,4],[-5,-37,8,4],[6,-55,6,3]].forEach(
    ([px,py,rx,ry])=>ellipse(ctx,px,py,rx,ry,'#6f7191',-.2));
  canopy(ctx,-38,-91,.95);
  canopy(ctx,5,-111,1.08);
  canopy(ctx,44,-91,.92);
  canopy(ctx,-5,-69,.9);
  ctx.restore();
}

function waterDetails(ctx) {
  ctx.strokeStyle = '#b7e9e4aa'; ctx.lineWidth = 3;
  [[45,210],[1400,650],[80,900],[1320,60],[1050,950]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.arc(x,y,18,0.3,2.7); ctx.stroke();
  });
  [[80,170],[1460,750],[1260,940]].forEach(([x,y]) => rock(ctx,x,y,.65));
}

export function drawIslandArena(ctx) {
  const water = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  water.addColorStop(0, '#43829b');
  water.addColorStop(0.55, '#65aaa9');
  water.addColorStop(1, '#386c91');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  waterDetails(ctx);
  drawIsland(ctx);
  tree(ctx, 180, 240, 1.2);
  tree(ctx, 1220, 170, 1.05);
  [[470, 130, 58], [520, 145, 48], [1050, 780, 55], [1120, 760, 46], [700, 900, 50]].forEach(
    ([x, y, height]) => bamboo(ctx, x, y, height));
}
