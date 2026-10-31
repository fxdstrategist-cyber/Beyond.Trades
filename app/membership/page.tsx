'use client';
import { useState } from 'react';
export default function MembershipPage() {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function checkout(){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/billing/checkout',{method:'POST'});
   const data=await response.json();
   if(!response.ok) throw new Error(data.error||'Unable to start checkout.');
   if(data.url) window.location.assign(data.url); else throw new Error('Checkout URL was not returned.');
  }catch(e){setError(e instanceof Error?e.message:'Unexpected billing error.');setBusy(false);}
 }
 return <main style={{minHeight:'100vh',background:'#090a0b',color:'#f4f1e9',padding:30,display:'grid',placeItems:'center'}}>
  <section style={{maxWidth:760,width:'100%'}}>
   <p style={{color:'#d8b45a',letterSpacing:2,fontSize:11,fontWeight:700}}>BEYOND.TRADES MEMBERSHIP</p>
   <h1 style={{fontSize:34}}>Go beyond the basics.</h1>
   <p style={{color:'#999',lineHeight:1.8}}>Start free. Upgrade when you want deeper performance insights, structured learning and premium member resources.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:15,marginTop:25}}>
    <article style={card}><h2>Free</h2><strong style={price}>$0</strong><p style={muted}>Personal journal foundation, risk tools and public education.</p><ul style={muted}><li>Trade journal</li><li>Risk and RRR tools</li><li>Public partner directory</li></ul><a href="/login" style={outline}>Create free account</a></article>
    <article style={{...card,borderColor:'#a88743'}}><p style={{color:'#d8b45a',fontSize:10,letterSpacing:1}}>MEMBER ACCESS</p><h2>Premium</h2><strong style={price}>Monthly</strong><p style={muted}>Premium analytics, structured courses and member-only learning resources.</p><ul style={muted}><li>Advanced journal analytics</li><li>Premium course library</li><li>Member learning resources</li><li>Priority session access (where offered)</li></ul><button onClick={checkout} disabled={busy} style={gold}>{busy?'Opening checkout…':'Subscribe monthly'}</button>{error&&<p style={{color:'#ed7777',fontSize:12}}>{error}</p>}</article>
   </div>
   <p style={{color:'#777',fontSize:11,marginTop:20,lineHeight:1.7}}>The recurring price is configured by the platform owner in Stripe. Subscription cancellation, renewal and refund terms must be displayed before payment. Trading and career outcomes are not guaranteed.</p>
   <a href="/" style={{color:'#d8b45a',fontSize:12}}>← Back to Beyond.Trades</a>
  </section>
 </main>;
}
const card={background:'#111315',border:'1px solid #303333',borderRadius:12,padding:24};
const price={fontSize:28,color:'#e8ca7d'};
const muted={color:'#a0a4a2',fontSize:13,lineHeight:2};
const gold={display:'block',width:'100%',padding:13,background:'linear-gradient(110deg,#c39a43,#ecd181)',border:0,borderRadius:6,color:'#15120b',fontWeight:700,cursor:'pointer',marginTop:20};
const outline={display:'block',textAlign:'center' as const,padding:12,border:'1px solid #a88743',borderRadius:6,color:'#ecd181',textDecoration:'none',marginTop:20};
