import fs from 'node:fs'
const op = fs.readFileSync('/tmp/op2.json','utf8')
const TOKEN = 'ap-real-e2e-engine-token-xyz'
const targets = {
  GCP:   'https://ap-engine-msxcels5epmzklhtgfh8e-7dayc4lqfa-uc.a.run.app',
  LOCAL: 'http://127.0.0.1:8095',
}
const pct = (a,p)=>{ if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(p/100*s.length))] }
const stats = a => ({avg:Math.round(a.reduce((x,y)=>x+y,0)/a.length), p50:Math.round(pct(a,50)), p95:Math.round(pct(a,95)), min:Math.round(Math.min(...a)), max:Math.round(Math.max(...a))})
async function call(url, path, body){ const t=performance.now(); try{ const r=await fetch(url+path,{method:body?'POST':'GET',headers:body?{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'}:{},body}); await r.text(); return performance.now()-t }catch(e){ return performance.now()-t } }
async function seq(url,path,body,n){ const out=[]; for(let i=0;i<n;i++) out.push(await call(url,path,body)); return out }
async function conc(url,path,body,total,concurrency){ let i=0; const lat=[]; const t0=performance.now(); async function worker(){ while(i<total){ i++; lat.push(await call(url,path,body)) } } await Promise.all(Array.from({length:concurrency},worker)); const wall=(performance.now()-t0)/1000; return {rps:+(total/wall).toFixed(1), wall:+wall.toFixed(1), lat:stats(lat)} }
for(const [name,url] of Object.entries(targets)){
  await seq(url,'/health',null,5) // warm
  await seq(url,'/execute',op,3)  // warm
}
console.log('\n=== HEALTH latency (transport), 20 sequential (ms) ===')
for(const [name,url] of Object.entries(targets)) console.log(name.padEnd(6), JSON.stringify(stats(await seq(url,'/health',null,20))))
console.log('\n=== EXECUTE latency (full flow), 20 sequential (ms) ===')
for(const [name,url] of Object.entries(targets)) console.log(name.padEnd(6), JSON.stringify(stats(await seq(url,'/execute',op,20))))
console.log('\n=== EXECUTE throughput, 60 requests @ concurrency 20 ===')
for(const [name,url] of Object.entries(targets)){ const r=await conc(url,'/execute',op,60,20); console.log(name.padEnd(6), 'rps='+r.rps, 'wall='+r.wall+'s', 'lat='+JSON.stringify(r.lat)) }
