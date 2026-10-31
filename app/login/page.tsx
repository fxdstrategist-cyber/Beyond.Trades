import { signIn, signUp } from '@/app/auth/actions';
import Link from 'next/link';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{error?:string;message?:string}> }) {
  const params = await searchParams;
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#090a0b',color:'#f4f1e9'}}>
    <section style={{width:'min(440px,100%)',background:'#111315',border:'1px solid #40351f',borderRadius:14,padding:28}}>
      <p style={{color:'#d8b45a',letterSpacing:2,fontSize:11,fontWeight:700}}>BEYOND.TRADES</p>
      <h1 style={{fontSize:27,marginBottom:8}}>Your trading workspace.</h1>
      <p style={{color:'#9a9d9c',fontSize:13,lineHeight:1.7}}>Sign in or create a free account to access your private journal and trader dashboard.</p>
      {params.error && <p role="alert" style={{color:'#ed7777',fontSize:12}}>{params.error}</p>}
      {params.message && <p style={{color:'#65c99a',fontSize:12}}>{params.message}</p>}
      <form action={signIn} style={{display:'grid',gap:10,marginTop:22}}>
        <label style={{fontSize:12}}>Email<input required name="email" type="email" autoComplete="email" style={input}/></label>
        <label style={{fontSize:12}}>Password<input required name="password" type="password" autoComplete="current-password" style={input}/></label>
        <button style={goldButton}>Sign in</button>
      </form>
      <div style={{height:1,background:'#2b2d2d',margin:'24px 0'}}/>
      <h2 style={{fontSize:16}}>Create your free account</h2>
      <form action={signUp} style={{display:'grid',gap:10}}>
        <label style={{fontSize:12}}>Display name<input name="display_name" style={input}/></label>
        <label style={{fontSize:12}}>Email<input required name="email" type="email" autoComplete="email" style={input}/></label>
        <label style={{fontSize:12}}>Password (at least 8 characters)<input required minLength={8} name="password" type="password" autoComplete="new-password" style={input}/></label>
        <button style={outlineButton}>Create free account</button>
      </form>
      <p style={{fontSize:11,color:'#818686',marginTop:20}}>By continuing, you agree to the platform terms and privacy notice. <Link href="/" style={{color:'#d8b45a'}}>Back to home</Link></p>
    </section>
  </main>;
}
const input={display:'block',width:'100%',padding:12,marginTop:6,background:'#090b0c',border:'1px solid #343738',borderRadius:6,color:'#fff'};
const goldButton={padding:13,background:'linear-gradient(110deg,#c39a43,#ecd181)',border:0,borderRadius:6,color:'#15120b',fontWeight:700,cursor:'pointer'};
const outlineButton={padding:13,background:'transparent',border:'1px solid #a88743',borderRadius:6,color:'#ecd181',fontWeight:700,cursor:'pointer'};
