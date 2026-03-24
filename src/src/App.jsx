import { useState, useEffect, useRef, useCallback } from "react";
import { loadFromSupabase, saveToSupabase } from "./supabase";

const NICHES = ["Dental","Med Spa","HVAC","Personal Injury Law","Real Estate","Medical","Restaurant","Salon","Auto Repair","Gym","Roofing","Insurance","Other"];
const STAGES = ["New Lead","Contacted","Demo Booked","Demo Done","Proposal Sent","Closed","Not Interested","Follow-Up"];
const OUTCOMES = ["","Voicemail","No Answer","Not Interested","Call Back","Interested","Demo Booked"];
const SOURCES = ["Google Maps","Cold Call","Cold Email","Walk-In","Referral","Social Media","Website Form","Warm Network","Outscraper"];
const SOLUTIONS = ["AI Voice Receptionist","AI Appointment Setter","AI Missed Call Text-Back","AI Lead Qualifier","AI Reactivation Campaign","AI Lead Nurture","AI Follow-Up SMS","AI Website Chat Widget","AI Google Review Manager","AI No-Show Recovery","AI Invoice Follow-Up","AI Client Onboarding","AI Cold Email System","AI Cold Calling System","AI SDR System","AI Content Repurposing","AI Referral & Loyalty","AI Post-Service Upsell","AI Abandoned Cart","AI Patient Intake","AI Inbound Call Spam Filter","Website + AI Bundle","Custom Solution"];
const MTYPES = ["Discovery Call","Demo Call","Proposal Call","Follow-Up Call","Client Onboarding","Change Request","Other"];
const MSTATUS = ["Scheduled","Completed","Cancelled","No Show"];
const MOUTCOMES = ["","Pitched — Thinking About It","Pitched — Sending Proposal","Proposal Accepted","Needs Follow-Up","Not Interested","No Show — Rescheduled","Closed"];
const SC = {"New Lead":"#6366f1","Contacted":"#3b82f6","Demo Booked":"#f59e0b","Demo Done":"#8b5cf6","Proposal Sent":"#ec4899","Closed":"#10b981","Not Interested":"#ef4444","Follow-Up":"#f97316"};
const TABS = ["🏠","📋","❄️","📥","👥","🎬","📅","🗓","📞","🧠","📝","📊","🤖"];
const TAB_NAMES = ["Dashboard","Pipeline","Cold Leads","Import","Clients","Demos","Meetings","Calendar","Scripts","Intel","Notes","Log","AI Chat"];
const CHAIN_BLACKLIST = ["aspen dental","bright now dental","comfort dental","gentle dental","heartland dental","coast dental","western dental","cvs minuteclinic","minuteclinic","hartford healthcare","yale new haven","one hour heating","service experts","ars rescue","morgan & morgan","home depot","walmart","walgreens","cvs pharmacy","rite aid","starbucks","mcdonalds","subway","dunkin","dominos","pizza hut","burger king","wendys","taco bell","chick-fil-a","panera","chipotle","panda express","five guys","jersey mikes","jimmy johns","great clips","supercuts","sport clips","fantastic sams","hair cuttery","planet fitness","anytime fitness","la fitness","snap fitness","gold's gym","equinox","jiffy lube","midas","meineke","firestone","pep boys","mavis","monro","autozone","o'reilly auto","advance auto"];

function isChain(n){return CHAIN_BLACKLIST.some(c=>n.toLowerCase().includes(c));}
function nicheMap(raw){
  if(!raw)return "Other";const r=raw.toLowerCase();
  if(r.includes("dentist")||r.includes("dental")||r.includes("orthodon"))return "Dental";
  if(r.includes("med spa")||r.includes("medspa")||r.includes("aesthetic")||r.includes("skin care")||r.includes("laser"))return "Med Spa";
  if(r.includes("hvac")||r.includes("heating")||r.includes("cooling")||r.includes("air condition")||r.includes("plumb")||r.includes("mechanical"))return "HVAC";
  if(r.includes("attorney")||r.includes("lawyer")||r.includes("law firm")||r.includes("legal")||r.includes("injury"))return "Personal Injury Law";
  if(r.includes("real estate")||r.includes("realtor")||r.includes("realty"))return "Real Estate";
  if(r.includes("doctor")||r.includes("physician")||r.includes("medical")||r.includes("clinic")||r.includes("chiro")||r.includes("physical therapy"))return "Medical";
  if(r.includes("restaurant")||r.includes("pizza")||r.includes("food")||r.includes("cafe")||r.includes("diner"))return "Restaurant";
  if(r.includes("salon")||r.includes("hair")||r.includes("nail")||r.includes("barber")||r.includes("beauty"))return "Salon";
  if(r.includes("auto")||r.includes("car repair")||r.includes("vehicle"))return "Auto Repair";
  if(r.includes("gym")||r.includes("fitness")||r.includes("crossfit")||r.includes("yoga"))return "Gym";
  if(r.includes("roof"))return "Roofing";if(r.includes("insurance"))return "Insurance";
  return "Other";
}

const defData = {
  prospects:[
    {id:1,name:"Dr. Ross Winakor MD",niche:"Medical",contact:"Dr. Ross Winakor",phone:"(860) 487-0002",stage:"New Lead",source:"Google Maps",rating:"3.4",reviews:"11",website:"",address:"34 Professional Park Rd, Storrs CT",notes:"No website. Low reviews. Walk in with demo.",callCount:0},
    {id:2,name:"Friend's Startup",niche:"Other",contact:"",phone:"",stage:"New Lead",source:"Warm Network",notes:"First client. Building Lovable site.",callCount:0},
  ],
  coldLeads:[],clients:[],demos:[
    {id:1,name:"Santoro's Pizzeria",solution:"AI Voice Receptionist",tool:"Retell.ai",status:"Built",notes:"Adapt for any niche in under an hour."}
  ],
  notes:[],log:[],meetings:[],changeRequests:[]
};

// ─── Helpers ───────────────────────────────────────────────
function Field({label,children,flex=1}){return <div style={{flex,minWidth:0}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>{label}</label>{children}</div>;}
function Row({children}){return <div style={{display:"flex",gap:8,marginBottom:8}}>{children}</div>;}

// ─── Forms ─────────────────────────────────────────────────
function ProspectForm({onSave,onCancel,S}){
  const [v,setV]=useState({name:"",niche:"Dental",contact:"",phone:"",stage:"New Lead",source:"Cold Call",rating:"",reviews:"",website:"",address:"",pitchSolution:"",notes:""});
  const u=(k,val)=>setV(x=>({...x,[k]:val}));
  return(<div style={S.card}>
    <div style={S.ct}>New Prospect</div>
    <Row><Field label="Business Name *"><input style={S.inp} value={v.name} onChange={e=>u("name",e.target.value)}/></Field><Field label="Niche"><select style={S.sel} value={v.niche} onChange={e=>u("niche",e.target.value)}>{NICHES.map(n=><option key={n}>{n}</option>)}</select></Field></Row>
    <Row><Field label="Contact"><input style={S.inp} value={v.contact} onChange={e=>u("contact",e.target.value)}/></Field><Field label="Phone"><input style={S.inp} value={v.phone} onChange={e=>u("phone",e.target.value)}/></Field></Row>
    <Row><Field label="Stage"><select style={S.sel} value={v.stage} onChange={e=>u("stage",e.target.value)}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Source"><select style={S.sel} value={v.source} onChange={e=>u("source",e.target.value)}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></Field></Row>
    <Row><Field label="Solution to Pitch"><select style={S.sel} value={v.pitchSolution} onChange={e=>u("pitchSolution",e.target.value)}><option value="">Not sure yet</option>{SOLUTIONS.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Website"><input style={S.inp} value={v.website} onChange={e=>u("website",e.target.value)}/></Field></Row>
    <Row><Field label="Rating"><input style={S.inp} value={v.rating} onChange={e=>u("rating",e.target.value)}/></Field><Field label="Reviews"><input style={S.inp} value={v.reviews} onChange={e=>u("reviews",e.target.value)}/></Field><Field label="Address"><input style={S.inp} value={v.address} onChange={e=>u("address",e.target.value)}/></Field></Row>
    <div style={{marginBottom:8}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>Notes</label><textarea style={{...S.ta,minHeight:50}} value={v.notes} onChange={e=>u("notes",e.target.value)}/></div>
    <div style={{display:"flex",gap:8}}><button style={S.btn} onClick={()=>{if(!v.name)return;onSave({...v,id:Date.now(),callCount:0});}}>Save</button><button style={S.btnG} onClick={onCancel}>Cancel</button></div>
  </div>);
}

function LeadForm({onSave,onCancel,S}){
  const [v,setV]=useState({name:"",niche:"Dental",contact:"",phone:"",website:"",address:"",rating:"",reviews:"",source:"Outscraper",outcome:"",followUp:"",notes:"",callCount:0});
  const u=(k,val)=>setV(x=>({...x,[k]:val}));
  return(<div style={S.card}>
    <div style={S.ct}>Add Cold Lead</div>
    <Row><Field label="Name *"><input style={S.inp} value={v.name} onChange={e=>u("name",e.target.value)}/></Field><Field label="Niche"><select style={S.sel} value={v.niche} onChange={e=>u("niche",e.target.value)}>{NICHES.map(n=><option key={n}>{n}</option>)}</select></Field></Row>
    <Row><Field label="Contact"><input style={S.inp} value={v.contact} onChange={e=>u("contact",e.target.value)}/></Field><Field label="Phone"><input style={S.inp} value={v.phone} onChange={e=>u("phone",e.target.value)}/></Field></Row>
    <Row><Field label="Website"><input style={S.inp} value={v.website} onChange={e=>u("website",e.target.value)}/></Field><Field label="Rating"><input style={S.inp} value={v.rating} onChange={e=>u("rating",e.target.value)}/></Field><Field label="Reviews"><input style={S.inp} value={v.reviews} onChange={e=>u("reviews",e.target.value)}/></Field></Row>
    <Row><Field label="Address"><input style={S.inp} value={v.address} onChange={e=>u("address",e.target.value)}/></Field><Field label="Follow-Up Date"><input style={S.inp} type="date" value={v.followUp} onChange={e=>u("followUp",e.target.value)}/></Field></Row>
    <div style={{marginBottom:8}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>Notes</label><textarea style={{...S.ta,minHeight:50}} value={v.notes} onChange={e=>u("notes",e.target.value)}/></div>
    <div style={{display:"flex",gap:8}}><button style={S.btn} onClick={()=>{if(!v.name)return;onSave({...v,id:Date.now(),called:false});}}>Save</button><button style={S.btnG} onClick={onCancel}>Cancel</button></div>
  </div>);
}

function DemoForm({onSave,onCancel,S}){
  const [v,setV]=useState({name:"",solution:"",tool:"",status:"Built",notes:""});
  const u=(k,val)=>setV(x=>({...x,[k]:val}));
  return(<div style={S.card}>
    <div style={S.ct}>New Demo</div>
    <Row><Field label="Name *"><input style={S.inp} value={v.name} onChange={e=>u("name",e.target.value)}/></Field><Field label="Solution"><select style={S.sel} value={v.solution} onChange={e=>u("solution",e.target.value)}><option value="">Select...</option>{SOLUTIONS.map(s=><option key={s}>{s}</option>)}</select></Field></Row>
    <Row><Field label="Tools"><input style={S.inp} placeholder="e.g. Retell.ai + Make.com" value={v.tool} onChange={e=>u("tool",e.target.value)}/></Field><Field label="Status"><select style={S.sel} value={v.status} onChange={e=>u("status",e.target.value)}>{["In Progress","Built","Needs Update"].map(s=><option key={s}>{s}</option>)}</select></Field></Row>
    <div style={{marginBottom:8}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>Notes</label><textarea style={{...S.ta,minHeight:50}} value={v.notes} onChange={e=>u("notes",e.target.value)}/></div>
    <div style={{display:"flex",gap:8}}><button style={S.btn} onClick={()=>{if(!v.name)return;onSave({...v,id:Date.now()});}}>Save</button><button style={S.btnG} onClick={onCancel}>Cancel</button></div>
  </div>);
}

function MeetingForm({onSave,onCancel,S}){
  const [v,setV]=useState({title:"",contact:"",phone:"",date:new Date().toISOString().split("T")[0],time:"",type:"Discovery Call",notes:"",outcome:"",status:"Scheduled",proposalAmt:"",setupFee:""});
  const u=(k,val)=>setV(x=>({...x,[k]:val}));
  return(<div style={S.card}>
    <div style={S.ct}>Schedule Meeting</div>
    <Row><Field label="Title *"><input style={S.inp} value={v.title} onChange={e=>u("title",e.target.value)}/></Field><Field label="Type"><select style={S.sel} value={v.type} onChange={e=>u("type",e.target.value)}>{MTYPES.map(t=><option key={t}>{t}</option>)}</select></Field></Row>
    <Row><Field label="Contact"><input style={S.inp} value={v.contact} onChange={e=>u("contact",e.target.value)}/></Field><Field label="Phone"><input style={S.inp} value={v.phone} onChange={e=>u("phone",e.target.value)}/></Field></Row>
    <Row><Field label="Date"><input style={S.inp} type="date" value={v.date} onChange={e=>u("date",e.target.value)}/></Field><Field label="Time"><input style={S.inp} type="time" value={v.time} onChange={e=>u("time",e.target.value)}/></Field><Field label="Status"><select style={S.sel} value={v.status} onChange={e=>u("status",e.target.value)}>{MSTATUS.map(t=><option key={t}>{t}</option>)}</select></Field></Row>
    <Row><Field label="Setup Fee ($)"><input style={S.inp} type="number" placeholder="0" value={v.setupFee} onChange={e=>u("setupFee",e.target.value)}/></Field><Field label="Monthly ($)"><input style={S.inp} type="number" placeholder="0" value={v.proposalAmt} onChange={e=>u("proposalAmt",e.target.value)}/></Field></Row>
    <div style={{marginBottom:8}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>Prep Notes</label><textarea style={{...S.ta,minHeight:60}} value={v.notes} onChange={e=>u("notes",e.target.value)}/></div>
    <div style={{display:"flex",gap:8}}><button style={S.btn} onClick={()=>{if(!v.title)return;onSave({...v,id:Date.now()});}}>Save</button><button style={S.btnG} onClick={onCancel}>Cancel</button></div>
  </div>);
}

function ClientForm({onSave,onCancel,S}){
  const [v,setV]=useState({name:"",niche:"Dental",contact:"",phone:"",email:"",solutions:[],setupFee:"",monthlyRetainer:"",devName:"",devPercent:"",startDate:new Date().toISOString().split("T")[0],billingDay:"1",notes:"",payments:[]});
  const u=(k,val)=>setV(x=>({...x,[k]:val}));
  const toggleSol=(sol)=>setV(x=>({...x,solutions:x.solutions.includes(sol)?x.solutions.filter(s=>s!==sol):[...x.solutions,sol]}));
  return(<div style={S.card}>
    <div style={S.ct}>New Client</div>
    <Row><Field label="Business Name *"><input style={S.inp} value={v.name} onChange={e=>u("name",e.target.value)}/></Field><Field label="Niche"><select style={S.sel} value={v.niche} onChange={e=>u("niche",e.target.value)}>{NICHES.map(n=><option key={n}>{n}</option>)}</select></Field></Row>
    <Row><Field label="Contact"><input style={S.inp} value={v.contact} onChange={e=>u("contact",e.target.value)}/></Field><Field label="Phone"><input style={S.inp} value={v.phone} onChange={e=>u("phone",e.target.value)}/></Field></Row>
    <Row><Field label="Email"><input style={S.inp} value={v.email} onChange={e=>u("email",e.target.value)}/></Field><Field label="Start Date"><input style={S.inp} type="date" value={v.startDate} onChange={e=>u("startDate",e.target.value)}/></Field></Row>
    <Row><Field label="Setup Fee ($)"><input style={S.inp} type="number" value={v.setupFee} onChange={e=>u("setupFee",e.target.value)}/></Field><Field label="Monthly ($)"><input style={S.inp} type="number" value={v.monthlyRetainer} onChange={e=>u("monthlyRetainer",e.target.value)}/></Field><Field label="Billing Day"><input style={S.inp} type="number" min="1" max="31" value={v.billingDay} onChange={e=>u("billingDay",e.target.value)}/></Field></Row>
    <Row><Field label="Developer"><input style={S.inp} value={v.devName} onChange={e=>u("devName",e.target.value)}/></Field><Field label="Dev Cut (%)"><input style={S.inp} type="number" value={v.devPercent} onChange={e=>u("devPercent",e.target.value)}/></Field></Row>
    <div style={{marginBottom:8}}>
      <label style={{fontSize:10,color:"#555",marginBottom:6,display:"block"}}>Services</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{SOLUTIONS.map(sol=><button key={sol} onClick={()=>toggleSol(sol)} style={{padding:"3px 7px",borderRadius:4,fontSize:10,cursor:"pointer",background:v.solutions.includes(sol)?"#c9a84c22":"transparent",color:v.solutions.includes(sol)?"#c9a84c":"#555",border:v.solutions.includes(sol)?"1px solid #c9a84c55":"1px solid #2a2a3e"}}>{sol}</button>)}</div>
    </div>
    <div style={{marginBottom:8}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>Notes</label><textarea style={{...S.ta,minHeight:50}} value={v.notes} onChange={e=>u("notes",e.target.value)}/></div>
    <div style={{display:"flex",gap:8}}><button style={S.btn} onClick={()=>{if(!v.name)return;onSave({...v,id:Date.now(),payments:[]});}}>Save Client</button><button style={S.btnG} onClick={onCancel}>Cancel</button></div>
  </div>);
}

function ChangeRequestForm({onSave,onCancel,S,clients}){
  const [v,setV]=useState({clientId:"",clientName:"",requestType:"Edit",description:"",priority:"Normal",status:"Open",date:new Date().toISOString().split("T")[0]});
  const u=(k,val)=>setV(x=>({...x,[k]:val}));
  return(<div style={S.card}>
    <div style={S.ct}>New Change Request</div>
    <Row>
      <Field label="Client"><select style={S.sel} value={v.clientId} onChange={e=>{const c=clients.find(x=>x.id===parseInt(e.target.value));u("clientId",e.target.value);u("clientName",c?.name||"");}}><option value="">Select...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Type"><select style={S.sel} value={v.requestType} onChange={e=>u("requestType",e.target.value)}>{["Edit","Bug Fix","New Feature","Content Update","Account Question","Other"].map(t=><option key={t}>{t}</option>)}</select></Field>
    </Row>
    <Row>
      <Field label="Priority"><select style={S.sel} value={v.priority} onChange={e=>u("priority",e.target.value)}>{["Low","Normal","High","Urgent"].map(p=><option key={p}>{p}</option>)}</select></Field>
      <Field label="Status"><select style={S.sel} value={v.status} onChange={e=>u("status",e.target.value)}>{["Open","In Progress","Completed","Waiting on Client"].map(s=><option key={s}>{s}</option>)}</select></Field>
    </Row>
    <div style={{marginBottom:8}}><label style={{fontSize:10,color:"#555",marginBottom:3,display:"block"}}>Description *</label><textarea style={{...S.ta,minHeight:70}} value={v.description} onChange={e=>u("description",e.target.value)}/></div>
    <div style={{display:"flex",gap:8}}><button style={S.btn} onClick={()=>{if(!v.description)return;onSave({...v,id:Date.now()});}}>Save</button><button style={S.btnG} onClick={onCancel}>Cancel</button></div>
  </div>);
}

function QuickNote({onSave,onCancel,S}){
  const [txt,setTxt]=useState("");
  return(<div style={{marginTop:6,display:"flex",gap:6}}>
    <input style={{...S.inp,flex:1,fontSize:11}} placeholder="Quick note..." autoFocus value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&txt.trim())onSave(txt);if(e.key==="Escape")onCancel();}}/>
    <button style={S.btnS} onClick={()=>txt.trim()&&onSave(txt)}>Save</button>
    <button style={S.btnD} onClick={onCancel}>✕</button>
  </div>);
}

// ─── AI Chat ───────────────────────────────────────────────
function AIChat({S, appData}){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(()=>{
    const loadChat = async () => {
      const data = await loadFromSupabase('chat_history');
      if(data && Array.isArray(data) && data.length > 0){
        setMessages(data);
      } else {
        setMessages([{role:"assistant", content:`⚔️ Command Center online. What do you need, Vedan?\n\nI know your full setup — Harvest Solutions, your pipeline, clients, everything. Talk to me here and it all stays in one place, synced across every device.`, ts:Date.now()}]);
      }
    };
    loadChat();
  },[]);

  useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const saveChat = async (msgs) => {
    setSyncing(true);
    await saveToSupabase('chat_history', msgs.slice(-100));
    setSyncing(false);
  };

  const buildContext = () => {
    const totalMRR = appData.clients.reduce((s,c)=>s+parseFloat(c.monthlyRetainer||0),0);
    const closedCount = appData.prospects.filter(p=>p.stage==="Closed").length;
    const activeCount = appData.prospects.filter(p=>!["Closed","Not Interested"].includes(p.stage)).length;
    const hotProspects = appData.prospects.filter(p=>["Demo Booked","Demo Done","Proposal Sent","Follow-Up"].includes(p.stage));
    const today = new Date().toISOString().split("T")[0];
    const todayMeetings = appData.meetings.filter(m=>m.date===today&&m.status==="Scheduled");
    return `You are Vedan's AI business partner and personal assistant. You live inside his Harvest Solutions Command Center app — a full CRM he uses every day on his phone and PC. All conversations happen HERE.

LIVE BUSINESS DATA:
- Prospects: ${appData.prospects.length} total | ${activeCount} active | ${closedCount} closed
- Clients: ${appData.clients.length} | $${totalMRR.toLocaleString()}/mo MRR
- Cold Leads: ${appData.coldLeads.length} (${appData.coldLeads.filter(l=>l.called).length} called)
- Hot pipeline: ${hotProspects.map(p=>p.name+"("+p.stage+")").join(", ")||"none"}
- Meetings today: ${todayMeetings.map(m=>m.title).join(", ")||"none"}
- Open change requests: ${(appData.changeRequests||[]).filter(cr=>cr.status==="Open"||cr.status==="In Progress").length}

WHO VEDAN IS:
- 20 years old. Building toward $1M. Full intensity, no excuses.
- Runs Harvest Solutions (harvestsolutionsai.com) — AI solutions for local CT businesses
- UConn student balancing school + multiple hustles
- Sales strategy: Lead with $300-800 entry packages (Missed Call Text-Back, Spam Filter, Google Review Manager). Upsell after. Priority channel: referral agreements with marketing agencies — mentor confirmed this is highest leverage free channel.
- Into cars, soccer, nutrition optimization

YOUR ROLE:
- Business partner, strategist, sales coach, personal advisor — not a yes-man
- Direct, sharp, zero fluff. Short unless depth needed.
- Reference his actual live data when relevant
- Ruthlessly analyze new business ideas: money mechanism, speed to cash, biggest risk, first move
- Give exact words and plays for sales situations
- Call it out when he's off track. Say it once, move on.
- No emojis unless he uses them first
- Today: ${new Date().toLocaleDateString()}

This is a persistent conversation synced across all his devices. Pick up where you left off.`;
  };

  const send = async () => {
    if(!input.trim()||loading) return;
    const userMsg = {role:"user", content:input.trim(), ts:Date.now()};
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const apiMessages = newMessages.slice(-30).map(m=>({role:m.role, content:m.content}));
      const response = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:buildContext(),
          messages:apiMessages,
        })
      });
      const data = await response.json();
      const text = data.content?.map(b=>b.text||"").join("")||"Something went wrong. Try again.";
      const assistantMsg = {role:"assistant", content:text, ts:Date.now()};
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      await saveChat(finalMessages);
    } catch(err) {
      const errMsg = {role:"assistant", content:"Connection error. Check your network and try again.", ts:Date.now()};
      const finalMessages = [...newMessages, errMsg];
      setMessages(finalMessages);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = async () => {
    const greeting = {role:"assistant", content:"Chat cleared. Fresh slate — what's on your mind?", ts:Date.now()};
    setMessages([greeting]);
    await saveToSupabase('chat_history', [greeting]);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",minHeight:400}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <div style={{color:"#c9a84c",fontWeight:700,fontSize:13}}>⚔️ AI Business Partner</div>
          <div style={{color:"#444",fontSize:10}}>Synced across all devices {syncing?"· saving...":""}</div>
        </div>
        <button style={{...S.btnD,fontSize:10}} onClick={clearChat}>Clear Chat</button>
      </div>
      <div style={{flex:1,overflowY:"auto",background:"#0a0a10",border:"1px solid #1e1e2e",borderRadius:8,padding:14,marginBottom:10,display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:8,alignItems:"flex-start"}}>
            <div style={{fontSize:10,fontWeight:700,color:m.role==="user"?"#c9a84c":"#6366f1",minWidth:18,marginTop:3,flexShrink:0}}>{m.role==="user"?"V":"AI"}</div>
            <div style={{maxWidth:"82%",background:m.role==="user"?"#c9a84c18":"#111118",border:`1px solid ${m.role==="user"?"#c9a84c33":"#1e1e2e"}`,borderRadius:m.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px",padding:"9px 12px",color:"#e2e2e8",fontSize:12.5,lineHeight:1.65,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.content}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6366f1",minWidth:18,marginTop:3}}>AI</div>
            <div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:"4px 12px 12px 12px",padding:"10px 14px"}}>
              <div style={{display:"flex",gap:5}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#c9a84c",animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input ref={inputRef} style={{...S.inp,flex:1,fontSize:13,padding:"10px 12px"}} placeholder="Ask anything — strategy, pipeline, scripts, ideas..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} disabled={loading}/>
        <button style={{...S.btn,padding:"10px 18px",fontSize:13,opacity:loading?0.5:1}} onClick={send} disabled={loading}>Send</button>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}`}</style>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function App(){
  const [d, setD] = useState(defData);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [fNiche, setFNiche] = useState("All");
  const [fStage, setFStage] = useState("All");
  const [fCalled, setFCalled] = useState("All");
  const [fSort, setFSort] = useState("Default");
  const [showP, setShowP] = useState(false);
  const [showL, setShowL] = useState(false);
  const [showDm, setShowDm] = useState(false);
  const [showM, setShowM] = useState(false);
  const [showC, setShowC] = useState(false);
  const [showCR, setShowCR] = useState(false);
  const [logTxt, setLogTxt] = useState("");
  const [logCount, setLogCount] = useState(1);
  const [noteTxt, setNoteTxt] = useState("");
  const [csvTxt, setCsvTxt] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [calMonth, setCalMonth] = useState(new Date());
  const [quickNoteId, setQuickNoteId] = useState(null);
  const [clientTab, setClientTab] = useState({});
  const saveTimer = useRef(null);
  const fileRef = useRef();

  // Load from Supabase on mount
  useEffect(()=>{
    const init = async () => {
      setSyncStatus("loading");
      const data = await loadFromSupabase('app_data');
      if(data){
        setD({...defData, ...data});
        setSyncStatus("synced");
      } else {
        // First time — save defaults
        await saveToSupabase('app_data', defData);
        setSyncStatus("synced");
      }
      setLoaded(true);
    };
    init();
  },[]);

  // Debounced save to Supabase
  const debouncedSave = useCallback((data) => {
    if(saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus("saving");
    saveTimer.current = setTimeout(async ()=>{
      await saveToSupabase('app_data', data);
      setSyncStatus("synced");
    }, 1200);
  },[]);

  useEffect(()=>{
    if(loaded) debouncedSave(d);
  },[d, loaded, debouncedSave]);

  const upd = p => setD(x=>({...x,...p}));
  const del = (k,id) => upd({[k]:d[k].filter(i=>i.id!==id)});
  const updArr = (k,id,patch) => upd({[k]:d[k].map(x=>x.id===id?{...x,...patch}:x)});

  const promote = (l) => upd({
    prospects:[...d.prospects,{id:Date.now(),name:l.name,niche:l.niche,contact:l.contact,phone:l.phone,stage:"Contacted",source:l.source,rating:l.rating,reviews:l.reviews,website:l.website,address:l.address,notes:l.notes,callCount:l.callCount||0,pitchSolution:""}],
    coldLeads:d.coldLeads.filter(x=>x.id!==l.id)
  });

  const copyPhone = (p) => { if(p) navigator.clipboard?.writeText(p).catch(()=>{}); };

  const addLog = () => {
    if(!logTxt.trim()) return;
    const cnt = parseInt(logCount)||1;
    upd({log:[{id:Date.now(),text:cnt>1?`${logTxt} (x${cnt})`:logTxt,date:new Date().toLocaleDateString(),count:cnt},...d.log]});
    setLogTxt(""); setLogCount(1);
  };

  const addNote = () => {
    if(!noteTxt.trim()) return;
    upd({notes:[{id:Date.now(),text:noteTxt,date:new Date().toLocaleDateString()},...d.notes]});
    setNoteTxt("");
  };

  const markPayment = (clientId,month,year,paid) => {
    upd({clients:d.clients.map(c=>{
      if(c.id!==clientId) return c;
      const payments=[...(c.payments||[])];
      const key=`${year}-${month}`;
      const idx=payments.findIndex(p=>p.key===key);
      if(idx>-1) payments[idx]={...payments[idx],paid};
      else payments.push({key,month,year,paid,amount:c.monthlyRetainer});
      return{...c,payments};
    })});
  };

  const parseCSV = () => {
    if(!csvTxt.trim()){setImportMsg("Paste CSV data first.");return;}
    const lines=csvTxt.trim().split("\n");
    if(lines.length<2){setImportMsg("Need header + at least one row.");return;}
    const headers=lines[0].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(h=>h.trim().toLowerCase().replace(/['"]/g,""));
    const getVal=(row,keys)=>{for(const k of keys){const i=headers.indexOf(k);if(i>-1&&row[i]){const v=row[i].trim().replace(/^["']|["']$/g,"");if(v)return v;}}return "";};
    const imported=[];
    for(let i=1;i<lines.length;i++){
      const row=lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      const name=getVal(row,["name","business_name","title","company"]);
      if(!name||name.length<2||isChain(name)) continue;
      const rawCat=getVal(row,["category","industry","type","subtypes","category_name","query"]);
      imported.push({id:Date.now()+i,name,contact:getVal(row,["contact","owner","person","contact_name","owner_name"]),phone:getVal(row,["phone","phone_number","telephone","phones_enriched","formatted_phone_number"]),website:getVal(row,["website","site","url","web","website_url"])||"",address:getVal(row,["address","street","full_address","formatted_address"])||"",rating:getVal(row,["rating","stars","google_rating","score"])||"",reviews:getVal(row,["reviews","review_count","reviews_count","user_ratings_total","total_reviews"])||"",industry:rawCat||"",niche:nicheMap(rawCat),source:"Outscraper",called:false,callCount:0,outcome:"",followUp:"",notes:""});
    }
    if(!imported.length){setImportMsg("No valid rows found.");return;}
    const nc={};imported.forEach(l=>{nc[l.niche]=(nc[l.niche]||0)+1;});
    upd({coldLeads:[...d.coldLeads,...imported]});
    setImportMsg(`✓ ${imported.length} leads imported`);
    setCsvTxt("");
  };

  const handleFile=(e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=(ev)=>{setCsvTxt(ev.target.result);setImportMsg("File loaded. Click Import.");};r.readAsText(f);e.target.value="";};
  const nextUncalled=()=>{const idx=filtL.findIndex(l=>!l.called);if(idx>-1){const el=document.getElementById(`lead-${filtL[idx].id}`);if(el)el.scrollIntoView({behavior:"smooth",block:"center"});}};

  const today=new Date().toISOString().split("T")[0];
  const todayDisplay=new Date().toLocaleDateString();
  const nowMonth=new Date().getMonth()+1;
  const nowYear=new Date().getFullYear();
  const todayDay=new Date().getDate();

  const todayMeetings=d.meetings.filter(m=>m.date===today&&m.status==="Scheduled");
  const followUpDueToday=d.coldLeads.filter(l=>l.followUp===today&&!l.called);
  const openCRs=(d.changeRequests||[]).filter(cr=>cr.status==="Open"||cr.status==="In Progress");
  const billingDueToday=d.clients.filter(c=>{const day=parseInt(c.billingDay||1);const key=`${nowYear}-${nowMonth}`;const paid=(c.payments||[]).find(p=>p.key===key)?.paid;return day===todayDay&&!paid;});
  const upcomingMeetings=[...d.meetings].filter(m=>m.status==="Scheduled").sort((a,b)=>new Date(a.date+"T"+(a.time||"00:00"))-new Date(b.date+"T"+(b.time||"00:00")));
  const closedCount=d.prospects.filter(p=>p.stage==="Closed").length;
  const activeCount=d.prospects.filter(p=>!["Closed","Not Interested"].includes(p.stage)).length;
  const calledCount=d.coldLeads.filter(l=>l.called).length;
  const hotProspects=d.prospects.filter(p=>["Demo Booked","Demo Done","Proposal Sent","Follow-Up"].includes(p.stage));
  const totalMRR=d.clients.reduce((s,c)=>s+parseFloat(c.monthlyRetainer||0),0);
  const totalSetup=d.clients.reduce((s,c)=>s+parseFloat(c.setupFee||0),0);
  const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
  const weekLog=d.log.filter(l=>{try{return new Date(l.date)>=weekAgo;}catch{return false;}});
  const todayLog=d.log.filter(l=>l.date===todayDisplay);

  const filtP=d.prospects.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search.toLowerCase())||p.niche?.toLowerCase().includes(search.toLowerCase())||p.contact?.toLowerCase().includes(search.toLowerCase());
    return ms&&(fNiche==="All"||p.niche===fNiche)&&(fStage==="All"||p.stage===fStage);
  });

  let filtL=d.coldLeads.filter(l=>{
    const ms=!search||l.name.toLowerCase().includes(search.toLowerCase())||l.niche?.toLowerCase().includes(search.toLowerCase());
    const mn=fNiche==="All"||l.niche===fNiche;
    const mc=fCalled==="All"||(fCalled==="Called"&&l.called)||(fCalled==="Not Called"&&!l.called)||(fCalled==="Interested"&&(l.outcome==="Interested"||l.outcome==="Demo Booked"))||(fCalled==="No Website"&&(!l.website||l.website.trim()===""))||(fCalled==="Follow-Up Today"&&l.followUp===today);
    return ms&&mn&&mc;
  });
  if(fSort==="Rating Low")filtL=[...filtL].sort((a,b)=>parseFloat(a.rating||5)-parseFloat(b.rating||5));
  else if(fSort==="Rating High")filtL=[...filtL].sort((a,b)=>parseFloat(b.rating||0)-parseFloat(a.rating||0));
  else if(fSort==="Reviews Low")filtL=[...filtL].sort((a,b)=>parseInt(a.reviews||999)-parseInt(b.reviews||999));
  else if(fSort==="No Website First")filtL=[...filtL].sort((a,b)=>(a.website?1:0)-(b.website?1:0));
  else if(fSort==="Follow-Up Date")filtL=[...filtL].sort((a,b)=>new Date(a.followUp||"9999")-new Date(b.followUp||"9999"));

  const prioColor=(p)=>p==="Urgent"?"#ef4444":p==="High"?"#f97316":p==="Normal"?"#f59e0b":"#6366f1";

  const S={
    wrap:{fontFamily:"system-ui,sans-serif",background:"#0a0a10",minHeight:"100vh",color:"#e2e2e8",fontSize:13},
    hdr:{background:"#111118",borderBottom:"1px solid #1e1e2e",padding:"10px 14px 0",position:"sticky",top:0,zIndex:100},
    logo:{fontSize:15,fontWeight:700,color:"#c9a84c",letterSpacing:1},
    tabs:{display:"flex",gap:1,overflowX:"auto",marginTop:6,WebkitOverflowScrolling:"touch"},
    tab:(a)=>({padding:"7px 10px",background:a?"#c9a84c":"transparent",color:a?"#0a0a10":"#555",border:"none",borderRadius:"5px 5px 0 0",cursor:"pointer",fontWeight:a?700:400,fontSize:13,whiteSpace:"nowrap",flexShrink:0}),
    body:{padding:12,maxWidth:980,margin:"0 auto"},
    card:{background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:12,marginBottom:10},
    ct:{fontSize:10,fontWeight:700,color:"#c9a84c",marginBottom:8,textTransform:"uppercase",letterSpacing:1},
    stats:{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"},
    stat:{flex:1,minWidth:65,background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:"8px 10px",textAlign:"center"},
    sn:{fontSize:18,fontWeight:700,color:"#c9a84c"},
    sl:{fontSize:9,color:"#444",marginTop:1},
    btn:{background:"#c9a84c",color:"#0a0a10",border:"none",borderRadius:5,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11},
    btnG:{background:"transparent",color:"#c9a84c",border:"1px solid #c9a84c44",borderRadius:5,padding:"5px 10px",cursor:"pointer",fontSize:11},
    btnS:{background:"#10b98122",color:"#10b981",border:"1px solid #10b98133",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:10},
    btnD:{background:"transparent",color:"#ef4444",border:"1px solid #ef444433",borderRadius:4,padding:"3px 7px",cursor:"pointer",fontSize:10},
    btnI:{background:"#6366f122",color:"#818cf8",border:"1px solid #6366f133",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:10},
    btnCopy:{background:"#c9a84c22",color:"#c9a84c",border:"1px solid #c9a84c33",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:10},
    inp:{background:"#0a0a10",border:"1px solid #1e1e2e",borderRadius:5,padding:"6px 9px",color:"#e2e2e8",fontSize:12,width:"100%",boxSizing:"border-box"},
    sel:{background:"#0a0a10",border:"1px solid #1e1e2e",borderRadius:5,padding:"6px 9px",color:"#e2e2e8",fontSize:12,width:"100%",boxSizing:"border-box"},
    ta:{background:"#0a0a10",border:"1px solid #1e1e2e",borderRadius:5,padding:"7px 9px",color:"#e2e2e8",fontSize:12,width:"100%",boxSizing:"border-box",minHeight:70,resize:"vertical"},
    item:{background:"#0d0d16",border:"1px solid #1a1a28",borderRadius:7,padding:10,marginBottom:7},
    bdg:(c)=>({background:c+"22",color:c,border:`1px solid ${c}33`,borderRadius:3,padding:"1px 6px",fontSize:9,fontWeight:600}),
    fi:{display:"flex",alignItems:"center",gap:7,padding:"6px 0",borderBottom:"1px solid #151520"},
    dot:{width:6,height:6,borderRadius:"50%",background:"#c9a84c",flexShrink:0},
    alertCard:{background:"#c9a84c15",border:"1px solid #c9a84c44",borderRadius:8,padding:12,marginBottom:10},
  };

  if(!loaded) return(
    <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",flexDirection:"column",gap:12}}>
      <div style={{color:"#c9a84c",fontSize:20}}>⚔</div>
      <div style={{color:"#c9a84c",fontSize:14,fontWeight:700}}>Loading Command Center...</div>
      <div style={{color:"#444",fontSize:11}}>Syncing from Supabase</div>
    </div>
  );

  const syncColor = syncStatus==="synced"?"#10b981":syncStatus==="saving"?"#f59e0b":"#ef4444";
  const syncLabel = syncStatus==="synced"?"● synced":syncStatus==="saving"?"● saving...":"● offline";

  return(
    <div style={S.wrap}>
      <div style={S.hdr}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={S.logo}>⚔ HARVEST</div>
          <div style={{fontSize:10,color:syncColor,paddingBottom:2}}>{syncLabel}</div>
        </div>
        <div style={S.tabs}>
          {TABS.map((t,i)=>(
            <button key={i} style={S.tab(tab===i)} onClick={()=>{setTab(i);setSearch("");}} title={TAB_NAMES[i]}>{t}</button>
          ))}
        </div>
      </div>

      <div style={S.body}>

        {/* DASHBOARD */}
        {tab===0&&<>
          <div style={S.stats}>
            {[[d.prospects.length,"PROSPECTS"],[activeCount,"ACTIVE"],[closedCount,"CLOSED"],[d.clients.length,"CLIENTS"],
              [`$${totalMRR.toLocaleString()}`,"MRR"],[`$${totalSetup.toLocaleString()}`,"SETUP"],
              [d.coldLeads.length,"LEADS"],[calledCount,"CALLED"],[d.demos.length,"DEMOS"]
            ].map(([n,l])=><div key={l} style={S.stat}><div style={S.sn}>{n}</div><div style={S.sl}>{l}</div></div>)}
          </div>

          {(todayMeetings.length>0||followUpDueToday.length>0||openCRs.length>0||billingDueToday.length>0)&&<div style={S.alertCard}>
            <div style={S.ct}>🔔 Today</div>
            {billingDueToday.map(c=><div key={c.id} style={S.fi}><div style={{...S.dot,background:"#10b981"}}/><div style={{flex:1}}><span style={{fontWeight:600,color:"#10b981"}}>PAYMENT DUE: {c.name}</span><span style={{color:"#555",fontSize:11,marginLeft:6}}>${c.monthlyRetainer}/mo</span></div></div>)}
            {todayMeetings.map(m=><div key={m.id} style={S.fi}><div style={{...S.dot,background:"#f59e0b"}}/><div style={{flex:1}}><span style={{fontWeight:600}}>MEETING: {m.title}</span>{m.contact&&<span style={{color:"#666",fontSize:11,marginLeft:6}}>{m.contact}</span>}</div><span style={{color:"#c9a84c",fontWeight:700}}>{m.time}</span></div>)}
            {followUpDueToday.map(l=><div key={l.id} style={S.fi}><div style={{...S.dot,background:"#ef4444"}}/><div style={{flex:1}}><span style={{fontWeight:600}}>FOLLOW-UP: {l.name}</span>{l.phone&&<span style={{color:"#c9a84c",fontSize:11,marginLeft:6}}>{l.phone}</span>}</div></div>)}
            {openCRs.slice(0,3).map(cr=><div key={cr.id} style={S.fi}><div style={{...S.dot,background:prioColor(cr.priority)}}/><div style={{flex:1}}><span style={{fontWeight:600}}>CR: {cr.clientName}</span><span style={{color:"#666",fontSize:11,marginLeft:6}}>{cr.requestType}</span></div><span style={S.bdg(prioColor(cr.priority))}>{cr.status}</span></div>)}
          </div>}

          <div style={S.card}>
            <div style={S.ct}>📊 Log Activity</div>
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <input style={{...S.inp,flex:1}} placeholder="What did you do?" value={logTxt} onChange={e=>setLogTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addLog()}/>
              <input style={{...S.inp,width:50}} type="number" min="1" max="999" value={logCount} onChange={e=>setLogCount(e.target.value)}/>
              <button style={S.btn} onClick={addLog}>Log</button>
            </div>
            {todayLog.slice(0,4).map(l=><div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #151520",color:"#777",fontSize:12}}><span>{l.text}</span><button style={S.btnD} onClick={()=>del("log",l.id)}>✕</button></div>)}
          </div>

          <div style={S.card}>
            <div style={S.ct}>📈 This Week</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[[weekLog.reduce((s,l)=>s+(l.count||1),0),"Actions"],[weekLog.filter(l=>l.text.toLowerCase().includes("call")).reduce((s,l)=>s+(l.count||1),0),"Calls"],[d.coldLeads.filter(l=>l.outcome==="Interested"||l.outcome==="Demo Booked").length,"Interested"],[closedCount,"Closed"]].map(([n,l])=><div key={l}><div style={{fontSize:18,fontWeight:700,color:"#c9a84c"}}>{n}</div><div style={{fontSize:10,color:"#555"}}>{l}</div></div>)}
            </div>
          </div>

          {hotProspects.length>0&&<div style={S.card}>
            <div style={S.ct}>🔥 Hot Pipeline</div>
            {hotProspects.map(p=><div key={p.id} style={S.fi}><div style={S.dot}/><div style={{flex:1}}><span style={{fontWeight:600}}>{p.name}</span>{p.phone&&<span style={{color:"#c9a84c",fontSize:11,marginLeft:6}}>{p.phone}</span>}</div><span style={S.bdg(SC[p.stage]||"#888")}>{p.stage}</span></div>)}
          </div>}

          {upcomingMeetings.length>0&&<div style={S.card}>
            <div style={S.ct}>📆 Upcoming Meetings</div>
            {upcomingMeetings.slice(0,3).map(m=><div key={m.id} style={S.fi}><div style={S.dot}/><div style={{flex:1}}><span style={{fontWeight:600}}>{m.title}</span>{m.contact&&<span style={{color:"#666",fontSize:11,marginLeft:6}}>{m.contact}</span>}</div><span style={{color:"#c9a84c",fontSize:11}}>{m.date}{m.time?` · ${m.time}`:""}</span></div>)}
          </div>}

          <div style={S.card}>
            <div style={S.ct}>🎯 Daily Non-Negotiables</div>
            {["10 cold calls","5 cold DMs","1 follow-up on hot leads","1 piece of content","1 hour on demos"].map((f,i)=><div key={i} style={S.fi}><div style={S.dot}/><span style={{color:"#777",fontSize:12}}>{f}</span></div>)}
          </div>
        </>}

        {/* PIPELINE */}
        {tab===1&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{color:"#444",fontSize:11}}>{filtP.length} prospects</div>
            <button style={S.btn} onClick={()=>setShowP(p=>!p)}>+ Add</button>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            <input style={{...S.inp,flex:1,minWidth:100}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select style={{...S.sel,width:110}} value={fNiche} onChange={e=>setFNiche(e.target.value)}><option value="All">All Niches</option>{NICHES.map(n=><option key={n}>{n}</option>)}</select>
            <select style={{...S.sel,width:120}} value={fStage} onChange={e=>setFStage(e.target.value)}><option value="All">All Stages</option>{STAGES.map(st=><option key={st}>{st}</option>)}</select>
          </div>
          {showP&&<ProspectForm S={S} onSave={(v)=>{upd({prospects:[...d.prospects,v]});setShowP(false);}} onCancel={()=>setShowP(false)}/>}
          {filtP.length===0&&<div style={{...S.card,color:"#444",textAlign:"center",padding:30}}>No prospects match filters.</div>}
          {filtP.map(p=><div key={p.id} style={S.item}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                <div style={{color:"#555",fontSize:11,marginTop:2}}>{p.niche}{p.contact?` · ${p.contact}`:""}{p.rating?` · ⭐${p.rating}`:""}</div>
                {p.pitchSolution&&<div style={{color:"#c9a84c",fontSize:11,marginTop:2}}>{p.pitchSolution}</div>}
                {p.phone&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><span style={{color:"#c9a84c",fontSize:12,fontWeight:600}}>{p.phone}</span><button style={S.btnCopy} onClick={()=>copyPhone(p.phone)}>Copy</button></div>}
                {p.notes&&<div style={{color:"#555",fontSize:11,marginTop:4}}>{p.notes}</div>}
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8,flexDirection:"column",alignItems:"flex-end"}}>
                <select style={{...S.sel,width:"auto",fontSize:10,padding:"3px 6px"}} value={p.stage} onChange={e=>updArr("prospects",p.id,{stage:e.target.value})}>{STAGES.map(st=><option key={st}>{st}</option>)}</select>
                <button style={S.btnD} onClick={()=>del("prospects",p.id)}>✕</button>
              </div>
            </div>
            <div style={{marginTop:7,display:"flex",gap:5,flexWrap:"wrap"}}>
              <span style={S.bdg(SC[p.stage]||"#888")}>{p.stage}</span>
              {(!p.website||p.website==="None")&&<span style={S.bdg("#ef4444")}>No Website</span>}
            </div>
          </div>)}
        </>}

        {/* COLD LEADS */}
        {tab===2&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{color:"#444",fontSize:11}}>{filtL.length} shown · {d.coldLeads.length-calledCount} to call</div>
            <div style={{display:"flex",gap:6}}><button style={S.btnI} onClick={nextUncalled}>Next →</button><button style={S.btn} onClick={()=>setShowL(p=>!p)}>+ Add</button></div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            <input style={{...S.inp,flex:1,minWidth:100}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select style={{...S.sel,width:100}} value={fNiche} onChange={e=>setFNiche(e.target.value)}><option value="All">All Niches</option>{NICHES.map(n=><option key={n}>{n}</option>)}</select>
            <select style={{...S.sel,width:110}} value={fCalled} onChange={e=>setFCalled(e.target.value)}><option value="All">All</option><option>Not Called</option><option>Called</option><option>Interested</option><option>No Website</option><option>Follow-Up Today</option></select>
            <select style={{...S.sel,width:130}} value={fSort} onChange={e=>setFSort(e.target.value)}><option value="Default">Sort</option><option value="No Website First">No Website First</option><option value="Rating Low">Rating Low</option><option value="Reviews Low">Reviews Low</option><option value="Follow-Up Date">Follow-Up Date</option></select>
          </div>
          {showL&&<LeadForm S={S} onSave={(v)=>{upd({coldLeads:[...d.coldLeads,v]});setShowL(false);}} onCancel={()=>setShowL(false)}/>}
          {filtL.map(l=><div key={l.id} id={`lead-${l.id}`} style={{...S.item,opacity:l.outcome==="Not Interested"?0.35:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div>
                <div style={{color:"#555",fontSize:11,marginTop:2}}>{l.niche}{l.contact?` · ${l.contact}`:""}{l.rating?` · ⭐${l.rating}`:""}{!l.website&&<span style={{color:"#ef4444"}}> · No site</span>}</div>
                {l.phone&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><span style={{color:"#c9a84c",fontSize:12,fontWeight:600}}>{l.phone}</span><button style={S.btnCopy} onClick={()=>copyPhone(l.phone)}>Copy</button></div>}
                {l.followUp&&<div style={{color:l.followUp===today?"#ef4444":"#f59e0b",fontSize:10,marginTop:2,fontWeight:l.followUp===today?700:400}}>{l.followUp===today?"📅 FOLLOW UP TODAY":"📅 "+l.followUp}</div>}
                {l.notes&&quickNoteId!==l.id&&<div style={{color:"#666",fontSize:11,marginTop:3}}>{l.notes}</div>}
                {quickNoteId===l.id&&<QuickNote S={S} onSave={(txt)=>{updArr("coldLeads",l.id,{notes:(l.notes?l.notes+"\n":"")+txt});setQuickNoteId(null);}} onCancel={()=>setQuickNoteId(null)}/>}
              </div>
              <button style={S.btnD} onClick={()=>del("coldLeads",l.id)}>✕</button>
            </div>
            <div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
              <button style={S.btn} onClick={()=>updArr("coldLeads",l.id,{called:true,callCount:(l.callCount||0)+1})}>📞 Called</button>
              <select style={{...S.sel,width:"auto",fontSize:10,padding:"2px 6px"}} value={l.outcome||""} onChange={e=>updArr("coldLeads",l.id,{outcome:e.target.value})}>{OUTCOMES.map(o=><option key={o} value={o}>{o||"Outcome..."}</option>)}</select>
              <button style={S.btnI} onClick={()=>setQuickNoteId(l.id)}>+ Note</button>
              {(l.outcome==="Interested"||l.outcome==="Demo Booked")&&<button style={S.btnS} onClick={()=>promote(l)}>→ Pipeline</button>}
              {l.callCount>0&&<span style={S.bdg("#f97316")}>📞 {l.callCount}x</span>}
              {l.outcome&&<span style={S.bdg(l.outcome==="Not Interested"?"#ef4444":l.outcome==="Interested"||l.outcome==="Demo Booked"?"#10b981":"#f59e0b")}>{l.outcome}</span>}
            </div>
          </div>)}
        </>}

        {/* IMPORT */}
        {tab===3&&<>
          <div style={S.card}>
            <div style={S.ct}>📥 Import CSV</div>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={handleFile}/>
            <button style={{...S.btnG,marginBottom:8}} onClick={()=>fileRef.current.click()}>📂 Upload File</button>
            <textarea style={{...S.ta,minHeight:120,fontSize:11,fontFamily:"monospace"}} placeholder="Or paste CSV content here..." value={csvTxt} onChange={e=>setCsvTxt(e.target.value)}/>
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
              <button style={S.btn} onClick={parseCSV}>Import Leads</button>
              <button style={S.btnG} onClick={()=>{setCsvTxt("");setImportMsg("");}}>Clear</button>
              {importMsg&&<span style={{color:importMsg.startsWith("✓")?"#10b981":"#ef4444",fontSize:12,fontWeight:600}}>{importMsg}</span>}
            </div>
          </div>
        </>}

        {/* CLIENTS */}
        {tab===4&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:11}}><span style={{color:"#10b981",fontWeight:700}}>${totalMRR.toLocaleString()}/mo</span><span style={{color:"#444"}}> · {d.clients.length} clients</span></div>
            <div style={{display:"flex",gap:6}}><button style={S.btnI} onClick={()=>setShowCR(p=>!p)}>+ CR</button><button style={S.btn} onClick={()=>setShowC(p=>!p)}>+ Client</button></div>
          </div>
          {showCR&&<ChangeRequestForm S={S} clients={d.clients} onSave={(v)=>{upd({changeRequests:[...(d.changeRequests||[]),v]});setShowCR(false);}} onCancel={()=>setShowCR(false)}/>}
          {showC&&<ClientForm S={S} onSave={(v)=>{upd({clients:[...d.clients,v]});setShowC(false);}} onCancel={()=>setShowC(false)}/>}
          {openCRs.length>0&&<div style={{...S.card,borderColor:"#f97316"}}>
            <div style={S.ct}>⚡ Open Change Requests</div>
            {openCRs.map(cr=><div key={cr.id} style={{...S.item,marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12}}>{cr.clientName} — {cr.requestType}</div><div style={{color:"#888",fontSize:11,marginTop:2}}>{cr.description}</div></div>
                <div style={{display:"flex",gap:5,flexDirection:"column",alignItems:"flex-end",marginLeft:8}}>
                  <select style={{...S.sel,width:"auto",fontSize:10,padding:"2px 5px"}} value={cr.status} onChange={e=>upd({changeRequests:(d.changeRequests||[]).map(x=>x.id===cr.id?{...x,status:e.target.value}:x)})}>{["Open","In Progress","Completed","Waiting on Client"].map(s=><option key={s}>{s}</option>)}</select>
                  <button style={S.btnD} onClick={()=>upd({changeRequests:(d.changeRequests||[]).filter(x=>x.id!==cr.id)})}>✕</button>
                </div>
              </div>
            </div>)}
          </div>}
          {d.clients.map(c=>{
            const key=`${nowYear}-${nowMonth}`;
            const paid=(c.payments||[]).find(p=>p.key===key)?.paid||false;
            const cTab=clientTab[c.id]||"overview";
            const devCut=c.devPercent?((parseFloat(c.monthlyRetainer||0)*parseFloat(c.devPercent))/100).toFixed(0):0;
            return(<div key={c.id} style={{...S.item,border:paid?"1px solid #10b98133":"1px solid #ef444433"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontWeight:700,fontSize:14}}>{c.name}</div><div style={{...S.bdg(paid?"#10b981":"#ef4444"),fontSize:9}}>{paid?"✓ PAID":"UNPAID"}</div></div><div style={{color:"#555",fontSize:11,marginTop:2}}>{c.niche}{c.contact?` · ${c.contact}`:""}{c.phone&&<span style={{color:"#c9a84c"}}> · {c.phone}</span>}</div></div>
                <div style={{display:"flex",gap:5,flexDirection:"column",alignItems:"flex-end"}}>
                  <button style={paid?S.btnD:S.btnS} onClick={()=>markPayment(c.id,nowMonth,nowYear,!paid)}>{paid?"Unpaid":"✓ Paid"}</button>
                  <button style={S.btnD} onClick={()=>del("clients",c.id)}>✕</button>
                </div>
              </div>
              <div style={{display:"flex",gap:6,margin:"8px 0",borderBottom:"1px solid #1a1a28",paddingBottom:8}}>
                {["overview","payments"].map(t=><button key={t} style={{...S.btnG,fontSize:10,padding:"2px 8px",background:cTab===t?"#c9a84c22":"transparent",color:cTab===t?"#c9a84c":"#555",border:cTab===t?"1px solid #c9a84c55":"1px solid #2a2a3e"}} onClick={()=>setClientTab({...clientTab,[c.id]:t})}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
              </div>
              {cTab==="overview"&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <div style={{background:"#c9a84c22",border:"1px solid #c9a84c33",borderRadius:5,padding:"4px 10px",fontSize:11}}><span style={{color:"#555"}}>Retainer: </span><span style={{color:"#c9a84c",fontWeight:700}}>${parseFloat(c.monthlyRetainer||0).toLocaleString()}/mo</span></div>
                <div style={{background:"#10b98122",border:"1px solid #10b98133",borderRadius:5,padding:"4px 10px",fontSize:11}}><span style={{color:"#555"}}>Setup: </span><span style={{color:"#10b981",fontWeight:700}}>${parseFloat(c.setupFee||0).toLocaleString()}</span></div>
                {c.devPercent&&<div style={{background:"#6366f122",border:"1px solid #6366f133",borderRadius:5,padding:"4px 10px",fontSize:11}}><span style={{color:"#555"}}>Your cut: </span><span style={{color:"#818cf8",fontWeight:700}}>${(parseFloat(c.monthlyRetainer||0)-parseFloat(devCut)).toFixed(0)}/mo</span></div>}
              </div>}
              {cTab==="payments"&&<div>{[...Array(6)].map((_,i)=>{const d2=new Date();d2.setMonth(d2.getMonth()-i);const m2=d2.getMonth()+1,y2=d2.getFullYear();const k2=`${y2}-${m2}`;const mN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];const isPaid=(c.payments||[]).find(p=>p.key===k2)?.paid||false;return(<div key={k2} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #151520"}}><span style={{color:"#888",fontSize:12}}>{mN[m2-1]} {y2}</span><button style={isPaid?S.btnS:S.btnD} onClick={()=>markPayment(c.id,m2,y2,!isPaid)}>{isPaid?"✓ Paid":"Unpaid"}</button></div>);})}</div>}
            </div>);
          })}
        </>}

        {/* DEMOS */}
        {tab===5&&<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{color:"#444",fontSize:11}}>{d.demos.length} demos</div>
            <button style={S.btn} onClick={()=>setShowDm(p=>!p)}>+ Add Demo</button>
          </div>
          {showDm&&<DemoForm S={S} onSave={(v)=>{upd({demos:[...d.demos,v]});setShowDm(false);}} onCancel={()=>setShowDm(false)}/>}
          {d.demos.map(dm=><div key={dm.id} style={S.item}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><div style={{fontWeight:700,fontSize:13}}>{dm.name}</div><div style={{color:"#555",fontSize:11,marginTop:2}}>{dm.solution}{dm.tool?` · ${dm.tool}`:""}</div>{dm.notes&&<div style={{color:"#666",fontSize:11,marginTop:3}}>{dm.notes}</div>}</div>
              <div style={{display:"flex",gap:5}}><span style={S.bdg(dm.status==="Built"?"#10b981":dm.status==="In Progress"?"#f59e0b":"#6366f1")}>{dm.status}</span><button style={S.btnD} onClick={()=>del("demos",dm.id)}>✕</button></div>
            </div>
          </div>)}
        </>}

        {/* MEETINGS */}
        {tab===6&&<>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{color:"#444",fontSize:11}}>{d.meetings.length} meetings</div>
            <button style={S.btn} onClick={()=>setShowM(p=>!p)}>+ Schedule</button>
          </div>
          {showM&&<MeetingForm S={S} onSave={(m)=>{upd({meetings:[...d.meetings,m]});setShowM(false);}} onCancel={()=>setShowM(false)}/>}
          {[...d.meetings].sort((a,b)=>new Date(b.date+"T"+(b.time||"00:00"))-new Date(a.date+"T"+(a.time||"00:00"))).map(m=><div key={m.id} style={S.item}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{m.title}</div><div style={{color:"#555",fontSize:11,marginTop:2}}>{m.type}{m.contact?` · ${m.contact}`:""}{m.date?` · ${m.date}`:""}{m.time?` at ${m.time}`:""}</div>{m.phone&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}><span style={{color:"#c9a84c",fontSize:11}}>{m.phone}</span><button style={S.btnCopy} onClick={()=>copyPhone(m.phone)}>Copy</button></div>}{m.notes&&<div style={{color:"#555",fontSize:11,marginTop:4}}>{m.notes}</div>}</div>
              <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8,flexDirection:"column",alignItems:"flex-end"}}>
                <select style={{...S.sel,width:"auto",fontSize:10,padding:"3px 6px"}} value={m.status} onChange={e=>updArr("meetings",m.id,{status:e.target.value})}>{MSTATUS.map(t=><option key={t}>{t}</option>)}</select>
                <select style={{...S.sel,width:"auto",fontSize:10,padding:"3px 6px"}} value={m.outcome||""} onChange={e=>updArr("meetings",m.id,{outcome:e.target.value})}>{MOUTCOMES.map(o=><option key={o} value={o}>{o||"Outcome..."}</option>)}</select>
                <button style={S.btnD} onClick={()=>del("meetings",m.id)}>✕</button>
              </div>
            </div>
            <div style={{marginTop:7,display:"flex",gap:5,flexWrap:"wrap"}}>
              <span style={S.bdg(m.status==="Completed"?"#10b981":m.status==="No Show"?"#ef4444":m.status==="Cancelled"?"#555":"#f59e0b")}>{m.status}</span>
              {m.date===today&&m.status==="Scheduled"&&<span style={S.bdg("#c9a84c")}>TODAY</span>}
            </div>
          </div>)}
        </>}

        {/* CALENDAR */}
        {tab===7&&(()=>{
          const yr=calMonth.getFullYear(),mo=calMonth.getMonth();
          const firstDay=new Date(yr,mo,1).getDay(),dim=new Date(yr,mo+1,0).getDate();
          const mNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
          const cells=[];for(let i=0;i<firstDay;i++)cells.push(null);for(let i=1;i<=dim;i++)cells.push(i);
          const getM=(day)=>{if(!day)return[];const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;return d.meetings.filter(m=>m.date===ds);};
          const isTdy=(day)=>day===new Date().getDate()&&mo===new Date().getMonth()&&yr===new Date().getFullYear();
          return(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <button style={S.btnG} onClick={()=>setCalMonth(new Date(yr,mo-1,1))}>← Prev</button>
              <div style={{fontWeight:700,fontSize:15}}>{mNames[mo]} {yr}</div>
              <button style={S.btnG} onClick={()=>setCalMonth(new Date(yr,mo+1,1))}>Next →</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {["S","M","T","W","T","F","S"].map((dy,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:"#555",padding:"4px 0",fontWeight:700}}>{dy}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {cells.map((day,i)=>{const ms=getM(day),ht=isTdy(day);return(<div key={i} style={{minHeight:55,background:ht?"#c9a84c22":day?"#0d0d16":"transparent",border:ht?"1px solid #c9a84c55":day?"1px solid #1a1a28":"none",borderRadius:5,padding:3}}>
                {day&&<div style={{fontSize:11,color:ht?"#c9a84c":"#555",fontWeight:ht?700:400}}>{day}</div>}
                {ms.map(m=><div key={m.id} style={{background:"#6366f133",borderRadius:3,padding:"1px 3px",fontSize:8,color:"#818cf8",marginTop:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{m.title}</div>)}
              </div>);})}
            </div>
          </div>);
        })()}

        {/* SCRIPTS */}
        {tab===8&&<>
          <div style={S.card}><div style={S.ct}>📞 Cold Call Opener</div><div style={{color:"#ccc",fontSize:12,lineHeight:1.8,background:"#0a0a10",padding:12,borderRadius:6,border:"1px solid #1e1e2e"}}>"Hey is [owner] available? ... Hey [name] — this is Vedan, I'm local out of West Hartford. I run Harvest Solutions — we help CT businesses automate their phones so they never miss a customer. Quick question — what happens when a call comes in and nobody picks up?"<div style={{color:"#555",fontSize:11,marginTop:6}}>→ Let them answer. "That's exactly what I fix. 10 minutes to show you — free any time this week?"</div></div></div>
          <div style={S.card}><div style={S.ct}>📱 Voicemail</div><div style={{color:"#ccc",fontSize:12,lineHeight:1.8,background:"#0a0a10",padding:12,borderRadius:6,border:"1px solid #1e1e2e"}}>"Hey [name] — Vedan from Harvest Solutions. We help CT businesses automate their phones with AI. Quick question about [Business Name] — call me back when you get a chance. [number]. Again [number]. Thanks."<div style={{color:"#555",fontSize:11,marginTop:6}}>Under 20 seconds. Number twice. Never pitch.</div></div></div>
          <div style={S.card}><div style={S.ct}>💬 Walk-In</div><div style={{color:"#ccc",fontSize:12,lineHeight:1.8,background:"#0a0a10",padding:12,borderRadius:6,border:"1px solid #1e1e2e"}}>"Is the owner around? ... Hey [name] — Vedan, Harvest Solutions, local out of West Hartford. I put together a quick demo for [business] — 2 minutes on my phone. Not selling today, just want your honest reaction. Is now bad?"<div style={{color:"#555",fontSize:11,marginTop:6}}>→ Show demo. "What do you think? I can have the real version live in a week."</div></div></div>
          <div style={S.card}><div style={S.ct}>🛡️ Objections</div>
            {[["How much?","'Depends on what we build — most clients pay $150-400/mo. Want an exact number based on what you need?'"],["Already have someone","'This works alongside them — handles overflow nights and weekends when nobody's there.'"],["Not tech savvy","'You don't need to be. I build it, maintain it, you just text me if something needs changing.'"],["Send me info","'What's your email? And so I send the right thing — is the main pain missed calls or follow-up?'"]].map(([obj,ans])=><div key={obj} style={{padding:"8px 0",borderBottom:"1px solid #1a1a28"}}><div style={{color:"#ef4444",fontSize:12,fontWeight:700,marginBottom:3}}>"{obj}"</div><div style={{color:"#888",fontSize:12,lineHeight:1.6}}>{ans}</div></div>)}
          </div>
        </>}

        {/* INTEL */}
        {tab===9&&<>
          <div style={S.card}>
            <div style={S.ct}>🎯 Entry Packages</div>
            {[["AI Missed Call Text-Back","$300-500 · $75-100/mo","Easiest yes. Call → hang up → instant text. Universal."],["AI Spam Filter","$300-500 · $75-100/mo","Every owner gets spam calls. Zero explanation needed."],["AI Google Review Manager","$400-600 · $100/mo","Walk in with their rating. Low stars = immediate pain."],["Website + AI Bundle","$800-1,200 · $150/mo","Walk in with a Lovable demo already built for them."]].map(([name,price,why])=><div key={name} style={{padding:"8px 0",borderBottom:"1px solid #1a1a28"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,fontSize:12}}>{name}</span><span style={{color:"#c9a84c",fontSize:10}}>{price}</span></div><div style={{color:"#666",fontSize:11,marginTop:2}}>{why}</div></div>)}
          </div>
          <div style={S.card}>
            <div style={S.ct}>🤝 Agency Partnerships</div>
            <div style={{color:"#888",fontSize:12,lineHeight:1.7,marginBottom:8}}>Highest leverage free channel per mentor. Marketing agencies have existing client trust. You = their AI arm. Split revenue, they look like heroes.</div>
            <div style={{color:"#ccc",fontSize:12,lineHeight:1.7,background:"#0a0a10",padding:10,borderRadius:6,border:"1px solid #1e1e2e"}}>"Hey [name] — Vedan from Harvest Solutions, West Hartford. We build AI automation for small businesses. Looking for marketing agencies to partner with as their AI arm. No competition, purely additive. Worth a 15-min call?"</div>
          </div>
          <div style={S.card}>
            <div style={S.ct}>❌ What's NOT Working</div>
            {[["Don't lead with Voice Receptionist","Too complex. Lead with Missed Call Text-Back or Spam Filter."],["Don't pitch on voicemail","20 sec max. Curiosity only. Number twice."],["Don't target chains","Private owners only. Corporate = unreachable."],["Don't say 'API' or 'webhook'","Say outcomes: 'you never miss a customer call'."]].map(([l,c])=><div key={l} style={{padding:"7px 0",borderBottom:"1px solid #1a1a28"}}><div style={{color:"#ef4444",fontWeight:600,fontSize:12,marginBottom:2}}>{l}</div><div style={{color:"#777",fontSize:11}}>{c}</div></div>)}
          </div>
        </>}

        {/* NOTES */}
        {tab===10&&<>
          <div style={S.card}>
            <div style={S.ct}>📝 Notes</div>
            <textarea style={{...S.ta,minHeight:80}} placeholder="Ideas, strategies, insights..." value={noteTxt} onChange={e=>setNoteTxt(e.target.value)}/>
            <div style={{marginTop:8}}><button style={S.btn} onClick={addNote}>Save Note</button></div>
          </div>
          {d.notes.map(n=><div key={n.id} style={{...S.item,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{color:"#ccc",fontSize:13,lineHeight:1.5}}>{n.text}</div><div style={{color:"#333",fontSize:10,marginTop:4}}>{n.date}</div></div><button style={S.btnD} onClick={()=>del("notes",n.id)}>✕</button></div>)}
        </>}

        {/* LOG */}
        {tab===11&&<>
          <div style={S.card}>
            <div style={S.ct}>📊 Log · {d.log.length} entries</div>
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <input style={{...S.inp,flex:1}} placeholder="What did you do?" value={logTxt} onChange={e=>setLogTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addLog()}/>
              <input style={{...S.inp,width:50}} type="number" min="1" value={logCount} onChange={e=>setLogCount(e.target.value)}/>
              <button style={S.btn} onClick={addLog}>Log</button>
            </div>
          </div>
          {d.log.map(l=><div key={l.id} style={{...S.item,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{color:"#ccc",fontSize:13}}>{l.text}</div><div style={{color:"#333",fontSize:10,marginTop:3}}>{l.date}</div></div><button style={S.btnD} onClick={()=>del("log",l.id)}>✕</button></div>)}
        </>}

        {/* AI CHAT */}
        {tab===12&&<AIChat S={S} appData={d}/>}

      </div>
    </div>
  );
}
