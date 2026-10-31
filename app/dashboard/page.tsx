import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('display_name, membership_tier').eq('id', user.id).maybeSingle();
  const { count: tradeCount } = await supabase.from('trades').select('*', { count:'exact', head:true }).eq('user_id', user.id);
  return <main style={{minHeight:'100vh',background:'#090a0b',color:'#f4f1e9',padding:'40px max(22px, calc((100vw - 1050px)/2))'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,borderBottom:'1px solid #2b2d2d',paddingBottom:20}}>
      <div><div style={{color:'#d8b45a',fontSize:11,letterSpacing:2,fontWeight:700}}>BEYOND.TRADES</div><h1 style={{fontSize:28,margin:'8px 0'}}>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}</h1><p style={{color:'#999',fontSize:13}}>Your private trading workspace.</p></div>
      <form action={signOut}><button style={{background:'transparent',border:'1px solid #4a4029',color:'#e7d39b',padding:'10px 14px',borderRadius:6}}>Sign out</button></form>
    </header>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginTop:25}}>
      <Metric label="Membership" value={profile?.membership_tier || 'free'}/>
      <Metric label="Trades recorded" value={String(tradeCount ?? 0)}/>
      <Metric label="Account email" value={user.email || 'Verified account'}/>
    </section>
    <section style={{marginTop:24,padding:22,border:'1px solid #39301e',borderRadius:10,background:'#111315'}}>
      <h2 style={{fontSize:18}}>Your next steps</h2>
      <p style={{color:'#a0a4a2',fontSize:13,lineHeight:1.8}}>The authenticated member area is connected to Supabase. The next integration is to move journal CRUD and image uploads into the protected database, then enable premium billing and course access.</p>
      <a href="/" style={{color:'#d8b45a',fontSize:12}}>Explore public website →</a>
    </section>
  </main>;
}
function Metric({label,value}:{label:string;value:string}) { return <div style={{padding:18,border:'1px solid #2c3030',background:'#111315',borderRadius:9}}><div style={{fontSize:11,color:'#999'}}>{label}</div><strong style={{display:'block',fontSize:19,marginTop:10,color:'#e8ca7d'}}>{value}</strong></div>; }
