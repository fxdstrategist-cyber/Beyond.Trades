import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
type RecordRow = { id:string; published_at:string; symbol:string|null; direction:string|null; entry_text:string|null; stop_loss_text:string|null; take_profit_text:string[]|null; result_label:string; result_r:string|null; image_paths:string[]; source_url:string|null; notes:string|null };
function supabasePublicUrl(path:string){ const base=process.env.NEXT_PUBLIC_SUPABASE_URL; return base ? `${base}/storage/v1/object/public/public-trade-record/${path}` : ''; }
export default async function TrackRecordPage() {
 let rows:RecordRow[]=[]; let configured=true;
 try {
  const supabase=await createClient();
  const {data,error}=await supabase.from('public_track_record').select('id,published_at,symbol,direction,entry_text,stop_loss_text,take_profit_text,result_label,result_r,image_paths,source_url,notes').eq('is_published',true).eq('verification_status','verified').order('published_at',{ascending:false}).limit(100);
  if(error) throw error; rows=(data||[]) as RecordRow[];
 } catch { configured=false; }
 return <main style={{minHeight:'100vh',background:'#090a0b',color:'#f4f1e9',padding:'36px max(20px, calc((100vw - 1100px)/2))'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,borderBottom:'1px solid #2b2d2d',paddingBottom:20}}>
   <div><p style={{color:'#d8b45a',fontSize:11,letterSpacing:2,fontWeight:700}}>BEYOND.TRADES / VERIFIED PERFORMANCE</p><h1 style={{fontSize:32,margin:'8px 0'}}>BTC Track Record</h1><p style={{color:'#999',fontSize:13}}>A transparent archive of published trade ideas and documented outcomes.</p></div>
   <Link href="/" style={{color:'#e8ca7d',fontSize:12}}>Home</Link>
  </header>
  <div style={{margin:'22px 0',padding:16,border:'1px solid #40351f',borderRadius:8,background:'#14130f',color:'#c8c1ad',fontSize:12,lineHeight:1.8}}>Only posts reviewed and marked verified appear here. Analysis-only posts, unconfirmed outcomes and incomplete setups are not counted as wins or losses. Past results do not predict future performance.</div>
  {!configured ? <p style={{color:'#edb4a0'}}>Track-record database is not connected yet. Configure Supabase and run supabase/schema.sql.</p> :
   rows.length===0 ? <section style={{padding:40,textAlign:'center',border:'1px solid #292d2d',borderRadius:10,background:'#111315'}}><h2 style={{fontSize:18}}>Verified trades will appear here.</h2><p style={{color:'#999',fontSize:12,lineHeight:1.8}}>The BTC Telegram archive has not been imported and reviewed yet. Once the channel export is processed, verified records can be published here with original chart images and source links.</p><a href="https://t.me/BTCBeyond_the_chart" target="_blank" rel="noreferrer" style={{color:'#d8b45a'}}>Visit BTCBeyond_the_chart →</a></section> :
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{rows.map(row=><article key={row.id} style={{border:'1px solid #303333',background:'#111315',borderRadius:10,padding:18}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10}}><b style={{fontSize:17}}>{row.symbol||'Market setup'}</b><span style={{fontSize:10,color:row.result_label==='win'?'#65c99a':row.result_label==='loss'?'#ed7777':'#d8b45a'}}>{row.result_label.toUpperCase()}</span></div>
    <p style={{fontSize:11,color:'#999'}}>{new Date(row.published_at).toLocaleString()} · {row.direction||'Direction not recorded'}</p>
    <div style={{fontSize:12,lineHeight:2,color:'#c9cbc8'}}>Entry: {row.entry_text||'—'}<br/>Stop: {row.stop_loss_text||'—'}<br/>Targets: {row.take_profit_text?.join(', ')||'—'}<br/>Result: {row.result_r||'Not quantified'}</div>
    {row.image_paths?.map(path=><img key={path} src={supabasePublicUrl(path)} alt={`Chart evidence for ${row.symbol||'trade'}`} style={{width:'100%',borderRadius:7,marginTop:10,border:'1px solid #333'}}/>)}
    {row.notes&&<p style={{fontSize:11,color:'#999',lineHeight:1.6}}>{row.notes}</p>}
    {row.source_url&&<a href={row.source_url} target="_blank" rel="noreferrer" style={{color:'#d8b45a',fontSize:11}}>Original Telegram post ↗</a>}
   </article>)}</div>}
  <p style={{fontSize:10,color:'#777',marginTop:30}}>Beyond.Trades is an educational platform. This archive is not a guarantee of future results or a recommendation to trade.</p>
 </main>;
}
