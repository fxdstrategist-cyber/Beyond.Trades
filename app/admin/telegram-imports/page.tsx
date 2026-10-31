import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export default async function TelegramImportsPage() {
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect('/login');
 const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(profile?.role!=='admin') redirect('/dashboard');
 const {data:imports}=await supabase.from('telegram_imports').select('id,source_channel,source_message_id,message_date,raw_text,media_paths,extraction_status,created_at').order('created_at',{ascending:false}).limit(100);
 return <main style={{minHeight:'100vh',background:'#090a0b',color:'#f4f1e9',padding:'35px max(20px, calc((100vw - 1100px)/2))'}}>
  <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><p style={{color:'#d8b45a',fontSize:11,letterSpacing:2}}>BEYOND.TRADES / ADMIN</p><h1 style={{fontSize:28}}>Telegram import review</h1><p style={{color:'#999',fontSize:12}}>Review imported channel posts before adding them to the public track record.</p></div><form action={signOut}><button style={{background:'transparent',border:'1px solid #514126',color:'#e8ca7d',padding:10,borderRadius:6}}>Sign out</button></form></header>
  <section style={{marginTop:24,display:'grid',gap:12}}>{(imports||[]).map(item=><article key={item.id} style={{background:'#111315',border:'1px solid #303333',borderRadius:9,padding:18}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:10}}><b style={{fontSize:13}}>{item.source_channel} / {item.source_message_id}</b><span style={{fontSize:10,color:'#d8b45a'}}>{item.extraction_status}</span></div>
   <p style={{fontSize:10,color:'#888'}}>{item.message_date?new Date(item.message_date).toLocaleString():'No source date'} · {item.media_paths?.length||0} media files</p>
   <p style={{fontSize:12,lineHeight:1.8,whiteSpace:'pre-wrap',color:'#c9cbc8'}}>{item.raw_text||'No text extracted.'}</p>
  </article>)}
  {!imports?.length&&<div style={{padding:35,textAlign:'center',background:'#111315',borderRadius:9,color:'#999',fontSize:12}}>No Telegram export records have been imported yet.</div>}</section>
  <p style={{fontSize:10,color:'#777',marginTop:25}}>Approval/publishing actions are intentionally not exposed until a reviewer workflow and source-evidence checks are configured.</p>
 </main>;
}
