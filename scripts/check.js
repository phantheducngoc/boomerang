import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const extensions=new Set(['.js','.css','.html','.svg']);
let count=0;
let failed=false;
async function check(directory) {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const path=join(directory,entry.name);
    if (entry.isDirectory()) { await check(path); continue; }
    if (!extensions.has(extname(path))) continue;
    const text=await readFile(path,'utf8');
    // Counting every nonblank line is deliberately stricter than the project rule.
    const lines=text.split(/\r?\n/).filter(line=>line.trim()).length;
    count++;
    if (lines>300) { console.error(`${path}: ${lines} lines exceeds 300`); failed=true; }
    if (extname(path)==='.js') {
      const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
      if (result.status!==0) { console.error(result.stderr); failed=true; }
    }
  }
}
for (const directory of ['public','server','shared','scripts','tests']) await check(directory);
if (failed) process.exitCode=1;
else console.log(`Checked ${count} files: valid JavaScript and all code files under 300 nonblank lines.`);
