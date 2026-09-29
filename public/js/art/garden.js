import { OBSTACLES } from '/shared/config.js';
import { drawIslandArena } from './islands.js';
import { ellipse, line } from './shapes.js';

function boulder(ctx, box) {
  const { x, y, w, h } = box;
  const depth = Math.min(22, h * .28);
  const top = [
    [x, y + h * .5], [x + w * .14, y + h * .1],
    [x + w * .62, y], [x + w, y + h * .3],
    [x + w * .86, y + h * .68], [x + w * .18, y + h * .76]
  ];
  ctx.save();
  ellipse(ctx, x + w / 2 + 8, y + h + 5, w * .56, h * .2, '#314f7438');
  face(ctx, [top[5],top[4],[top[4][0],top[4][1]+depth],
    [top[5][0],top[5][1]+depth]], '#4e6096');
  face(ctx, [top[4],top[3],[top[3][0],top[3][1]+depth],
    [top[4][0],top[4][1]+depth]], '#5b6da4');
  face(ctx, top, '#7c8fc9');
  face(ctx, [top[1],top[2],[x+w*.72,y+h*.22],[x+w*.28,y+h*.32]], '#a5b2df');
  line(ctx, [top[5],top[4]], '#435889', 3);
  ctx.restore();
}

function face(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach(point => ctx.lineTo(...point));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function crate(ctx, x, groundY, size) {
  const depth = size * .3;
  const height = size * .7;
  const topY = groundY - height;
  ellipse(ctx, x + size * .58, groundY + 4, size * .68, size * .2, '#3d56703b');
  face(ctx, [[x,topY],[x+depth,topY-depth],[x+size+depth,topY-depth],[x+size,topY]], '#bf8057');
  face(ctx, [[x+size,topY],[x+size+depth,topY-depth],
    [x+size+depth,groundY-depth],[x+size,groundY]], '#704353');
  face(ctx, [[x,topY],[x+size,topY],[x+size,groundY],[x,groundY]], '#8d5260');
  ctx.strokeStyle = '#603946';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, topY + 2, size - 4, height - 4);
  line(ctx, [[x+5,topY+5],[x+size-5,groundY-5]], '#bd7658', 4);
  line(ctx, [[x+size*.22,topY-depth*.42],[x+size*.82,topY-depth*.42]], '#df9c68', 3);
}

function crates(ctx, box) {
  const { x, y, w, h } = box;
  const size = Math.min(42, h * .82);
  const count = Math.max(1, Math.floor(w / 48));
  for (let i = count - 1; i >= 0; i--) crate(ctx, x + 3 + i * 44, y + h, size);
}

function crackedCrate(ctx, box) {
  const { x, y, w, h } = box;
  ellipse(ctx,x+w/2,y+h*.72,w*.48,h*.18,'#3d567039');
  const boards=[
    {x:x+w*.16,y:y+h*.48,w:w*.42,h:13,a:-.18},
    {x:x+w*.47,y:y+h*.6,w:w*.4,h:12,a:.22},
    {x:x+w*.34,y:y+h*.78,w:w*.34,h:10,a:-.05}
  ];
  for (const board of boards) {
    ctx.save();
    ctx.translate(board.x,board.y); ctx.rotate(board.a);
    face(ctx,[[0,0],[board.w,0],[board.w-4,board.h],[4,board.h]],'#89505d');
    line(ctx,[[7,3],[board.w*.48,board.h-2],[board.w*.62,3]],'#4e3440',2);
    ctx.restore();
  }
  [[.12,.72], [.76,.35], [.86,.8], [.55,.28]].forEach(([px,py],index) => {
    ctx.save(); ctx.translate(x+w*px,y+h*py); ctx.rotate(index*.8);
    face(ctx,[[0,-5],[8,0],[1,7],[-5,2]],index%2?'#b97558':'#6d4351');
    ctx.restore();
  });
}

export function drawGarden(ctx) {
  drawIslandArena(ctx);
}

export function drawCover(ctx, box, index) {
  if (box.kind === 'crate') crates(ctx, box);
  else boulder(ctx, box);
}

export function drawAllCover(ctx, broken = []) {
  OBSTACLES.forEach((box,index) => {
    if (broken.includes(index) && box.kind === 'crate') crackedCrate(ctx,box);
    else drawCover(ctx,box,index);
  });
}
