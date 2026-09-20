import {readFile,writeFile,mkdir,readdir,cp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

// No bundler or network dependencies. Emit only the static production site.
const out=resolve('dist');
if(out!==resolve(process.cwd(),'dist'))throw new Error('Invalid output path');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp('vendor',`${out}/vendor`,{recursive:true});await mkdir(`${out}/src`);
for(const name of await readdir('src'))if(name!=='evidence.js')await cp(`src/${name}`,`${out}/src/${name}`);
let html=await readFile('index.html','utf8');
html=html.replace(/<aside id="panel"[\s\S]*?<\/aside>/,'').replace(/<button id="panel-toggle"[^>]*>[\s\S]*?<\/button>/,'').replace('<output id="diagnostics" hidden></output>','');
await writeFile(`${out}/index.html`,html);
let app=(await readFile('src/app.js','utf8')).replaceAll('\r\n','\n');
const replaceRequired=(from,to)=>{if(!app.includes(from))throw new Error(`Build anchor missing: ${from.slice(0,60)}`);app=app.replace(from,to);};
replaceRequired(app.slice(app.indexOf('// Evidence runner is available')),'');
replaceRequired("let last=performance.now(),diagnosticAt=0,evidence=null;","let last=performance.now();");
replaceRequired(app.slice(app.indexOf('function snapshot(){'),app.indexOf('function frame(now){')),'');
replaceRequired(" if(now-diagnosticAt>250){diagnosticAt=now;$('diagnostics').textContent=JSON.stringify(snapshot());}\n",'');
replaceRequired(' if(evidence)evidence.frame(dt,snapshot());\n','');
replaceRequired(app.slice(app.indexOf('function showPanel(show)'),app.indexOf('const ray=new T.Raycaster()')),'');
replaceRequired('showPanel(false);','');
const resetControls=app.slice(app.indexOf("for(const [id,v] of [['distance'"),app.indexOf('light(1);select(null)'));
replaceRequired(resetControls,'');
await writeFile(`${out}/src/app.js`,app);await writeFile(`${out}/.nojekyll`,'');
const files=[];
async function inspect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())await inspect(p);else{const bytes=await readFile(p);files.push({path:p.slice(out.length+1).replaceAll('\\','/'),bytes:bytes.length,gzipBytes:gzipSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await inspect(out);
for(const f of files.filter(f=>/\.(js|html|css)$/.test(f.path)&&!f.path.startsWith('vendor/'))){const text=await readFile(`${out}/${f.path}`,'utf8');if(/localhost|[CD]:[\\/]|__evidence|createEvidenceRunner|\.\/evidence\.js/.test(text))throw new Error(`Development dependency in ${f.path}`);}
const report={files,totalBytes:files.reduce((n,f)=>n+f.bytes,0),gzipEstimateBytes:files.reduce((n,f)=>n+f.gzipBytes,0)};
await writeFile('production-build-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
