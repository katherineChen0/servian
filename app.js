// Minimal Serbian flashcard app using localStorage and Web Speech API
const STORAGE_KEY = 'serbian_vocab_v1'

const defaultVocab = [
  {term:'molim te',meaning:'please',notes:''},
  {term:'hvala',meaning:'thank you',notes:''},
  {term:'nema na čemu',meaning:"it's nothing",notes:''},
  {term:'naravno',meaning:'of course',notes:''},
  {term:'laku noć',meaning:'good night',notes:''},
  {term:'izvini',meaning:'sorry',notes:''},
  {term:'toplo',meaning:'warm',notes:''},
  {term:'hladno',meaning:'cold',notes:''},
  {term:'vruće',meaning:'hot',notes:''},
  {term:'daj',meaning:'give',notes:''},
  {term:'dobro jutro',meaning:'good morning',notes:''},
  {term:'ljubičasta',meaning:'purple',notes:'(fem)'},
  {term:'život',meaning:'life',notes:'(zh)'},
  {term:'žaba',meaning:'frog',notes:''},
  {term:'čekaj',meaning:'wait',notes:''},
  {term:'radim nešto ovde',meaning:"I'm working (rad = work)",notes:''},
  {term:'baš si lepa',meaning:"you're so pretty (fem)",notes:''},
  {term:'ti si slatka',meaning:'you are cute (fem)',notes:''},
  {term:'jebi ga',meaning:'fuck (colloquial)',notes:''},
  {term:'sviđa mi se',meaning:'I like it / Like',notes:'svidja -> sviđa'},
  {term:'ili',meaning:'or',notes:''},
  {term:'i',meaning:'and',notes:''},
  {term:'zec',meaning:'rabbit',notes:'(zets)'},
  {term:'zeka',meaning:'bunny',notes:''},
  {term:'da li',meaning:'are you / question marker',notes:''},
  {term:'to je',meaning:'that is',notes:''},
  {term:'ja sam',meaning:'I am',notes:''},
  {term:'takođe',meaning:'also / you as well',notes:''}
]

let vocab = []
let reviewQueue = []
let currentIndex = 0
let currentRecorder = null
let currentRecordChunks = []
let currentRecordingIdx = null
let currentStream = null

// SRS schedule in minutes (for quick testing small values, increase for real use)
const SCHEDULE_MINUTES = [1, 10, 60*24, 60*24*3, 60*24*7, 60*24*30]

function loadVocab(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw){ vocab = defaultVocab.map(w=>attachMeta(w)); saveVocab(); return }
    const parsed = JSON.parse(raw)
    vocab = parsed.map(w=>attachMeta(w))
  }catch(e){console.error('load error',e); vocab = defaultVocab.map(w=>attachMeta(w));}
}

function attachMeta(w){
  return Object.assign({level:0,nextReview:0,created:Date.now()},w)
}

function saveVocab(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vocab))
  renderList()
}

function renderList(){
  const ul = document.getElementById('wordList')
  ul.innerHTML = ''
  vocab.forEach((w,i)=>{
    const li = document.createElement('li')
    const left = document.createElement('div')
    left.innerHTML = `<strong>${w.term}</strong><div class='word-meta'>${w.meaning} ${w.notes? '· '+w.notes : ''}</div>`
    const right = document.createElement('div')
    right.style.display='flex'
    right.style.gap='8px'
    // play: prefer uploaded/recorded audio, else TTS
    const play = document.createElement('button')
    play.textContent='🔊'
    play.onclick = ()=> playAudio(w)

    // upload input (hidden) and button
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'audio/*'
    fileInput.style.display = 'none'
    fileInput.onchange = (e)=>{ const f=e.target.files[0]; if(f) handleUploadForWord(i,f) }
    const uploadBtn = document.createElement('button')
    uploadBtn.textContent = 'Upload'
    uploadBtn.onclick = ()=> fileInput.click()

    // record button
    const recBtn = document.createElement('button')
    recBtn.textContent = 'Record'
    recBtn.onclick = ()=> toggleRecordingForIndex(i, recBtn)

    // delete word
    const del = document.createElement('button')
    del.textContent='Delete'
    del.onclick = ()=>{ if(confirm('Delete this word?')){ vocab.splice(i,1); saveVocab() } }

    // delete audio
    const delAudio = document.createElement('button')
    delAudio.textContent = 'Delete audio'
    delAudio.onclick = ()=>{ const idx=vocab.findIndex(x=>x.term===w.term && x.meaning===w.meaning); if(idx>=0){ delete vocab[idx].audioData; saveVocab() } }

    right.append(play, uploadBtn, recBtn, delAudio, del, fileInput)
    li.append(left,right)
    ul.append(li)
  })
}

function playAudio(w){
  if(w && w.audioData){
    try{
      const a = new Audio(w.audioData)
      a.play()
      return
    }catch(e){ console.warn('playback failed',e) }
  }
  // fallback to TTS
  speak(w.term)
}

// Handle user upload for a given vocab index
function handleUploadForWord(index, file){
  const reader = new FileReader()
  reader.onload = e=>{
    const dataUrl = e.target.result
    const idx = vocab.findIndex(x=>x.term===vocab[index].term && x.meaning===vocab[index].meaning)
    if(idx>=0){ vocab[idx].audioData = dataUrl; saveVocab(); alert('Audio uploaded') }
  }
  reader.readAsDataURL(file)
}

// Recording controls
async function toggleRecordingForIndex(index, buttonEl){
  if(currentRecorder && currentRecordingIdx===index){
    // stop
    currentRecorder.stop()
    buttonEl.textContent = 'Record'
    return
  }
  // if another recording active, stop it first
  if(currentRecorder){ currentRecorder.stop(); }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('Recording not supported on this device')
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true})
    currentStream = stream
    currentRecordChunks = []
    const mr = new MediaRecorder(stream)
    currentRecorder = mr
    currentRecordingIdx = index
    buttonEl.textContent = 'Stop'
    mr.ondataavailable = ev => { if(ev.data && ev.data.size>0) currentRecordChunks.push(ev.data) }
    mr.onstop = async ()=>{
      const blob = new Blob(currentRecordChunks, {type: currentRecordChunks[0]?.type || 'audio/webm'})
      // convert to dataURL
      const r = new FileReader()
      r.onload = e=>{
        const dataUrl = e.target.result
        const idx = vocab.findIndex(x=>x.term===vocab[index].term && x.meaning===vocab[index].meaning)
        if(idx>=0){ vocab[idx].audioData = dataUrl; saveVocab(); alert('Recording saved') }
      }
      r.readAsDataURL(blob)
      // cleanup
      currentRecorder = null
      currentRecordChunks = []
      currentRecordingIdx = null
      if(currentStream){ currentStream.getTracks().forEach(t=>t.stop()); currentStream=null }
    }
    mr.start()
  }catch(err){ alert('Microphone access denied or error: '+err.message) }
}

function addWord(term,meaning,notes){
  vocab.unshift(attachMeta({term,meaning,notes}))
  saveVocab()
}

// Review queue: pick items due now (nextReview <= now) or all if none due
function buildReviewQueue(){
  const now = Date.now()
  const due = vocab.filter(w=>w.nextReview <= now)
  reviewQueue = due.length? due.slice() : vocab.slice()
  // shuffle
  for(let i=reviewQueue.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1)); [reviewQueue[i],reviewQueue[j]]=[reviewQueue[j],reviewQueue[i]]
  }
  currentIndex = 0
}

function showCard(){
  const front = document.getElementById('front')
  const back = document.getElementById('back')
  if(currentIndex >= reviewQueue.length){
    front.textContent = 'Review completed!'
    back.textContent = ''
    return
  }
  const w = reviewQueue[currentIndex]
  front.textContent = w.term
  back.textContent = `${w.meaning}${w.notes? ' · '+w.notes : ''}`
}

function markAnswer(correct){
  const w = reviewQueue[currentIndex]
  if(!w) return
  if(correct){
    w.level = Math.min(w.level+1, SCHEDULE_MINUTES.length-1)
  } else {
    w.level = Math.max(0, w.level-1)
  }
  const minutes = SCHEDULE_MINUTES[w.level] || SCHEDULE_MINUTES[0]
  w.nextReview = Date.now() + minutes*60*1000
  // update master list entry by matching term+meaning
  const idx = vocab.findIndex(x=>x.term===w.term && x.meaning===w.meaning)
  if(idx>=0) vocab[idx]=w
  saveVocab()
  currentIndex++
  showCard()
}

// Voice selection and speaking
const VOICE_STORAGE_KEY = 'serbian_voice_name'

function getSavedVoiceName(){ return localStorage.getItem(VOICE_STORAGE_KEY) }
function saveVoiceName(name){ localStorage.setItem(VOICE_STORAGE_KEY, name) }

function populateVoices(){
  const select = document.getElementById('voiceSelect')
  select.innerHTML = ''
  if(!window.speechSynthesis){
    const opt = document.createElement('option'); opt.textContent = 'No speech support'; opt.disabled=true; select.append(opt); return
  }
  const voices = speechSynthesis.getVoices() || []
  // prefer voices with Serbian language tag
  const preferred = voices.filter(v=>v.lang && v.lang.toLowerCase().startsWith('sr'))
  const saved = getSavedVoiceName()
  // helper to add option
  function addOption(v){
    const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} — ${v.lang}`; select.append(o)
  }
  // if no voices yet, show placeholder
  if(voices.length===0){
    const o = document.createElement('option'); o.textContent = 'Loading voices…'; o.disabled=true; select.append(o); return
  }
  // add Serbian voices first
  preferred.forEach(addOption)
  // add remaining voices (avoid duplicates)
  voices.filter(v=>!preferred.includes(v)).forEach(addOption)

  // select saved voice if available, else pick best Serbian voice, else first
  const choose = () => {
    if(saved){
      const matched = voices.find(v=>v.name===saved)
      if(matched){ select.value = matched.name; return }
    }
    if(preferred.length) { select.value = preferred[0].name; return }
    select.value = voices[0].name
  }
  choose()
}

function speak(text){
  if(!window.speechSynthesis) return alert('Speech synthesis not supported')
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  // pick voice by saved selection
  const select = document.getElementById('voiceSelect')
  const name = select && select.value ? select.value : getSavedVoiceName()
  if(name && window.speechSynthesis.getVoices){
    const v = speechSynthesis.getVoices().find(x=>x.name===name)
    if(v) utter.voice = v
  }
  // ensure language tag is set to Serbian to help engines choose pronunciation
  utter.lang = 'sr-RS'
  speechSynthesis.cancel()
  speechSynthesis.speak(utter)
}

// Import / Export
function exportJSON(){
  const data = JSON.stringify(vocab, null, 2)
  const blob = new Blob([data],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download='serbian_vocab.json'; a.click(); URL.revokeObjectURL(url)
}

function importJSONFile(file){
  const reader = new FileReader()
  reader.onload = e=>{
    try{
      const parsed = JSON.parse(e.target.result)
      if(Array.isArray(parsed)){
        vocab = parsed.map(attachMeta)
        saveVocab()
        alert('Import complete')
      } else alert('Invalid JSON format')
    }catch(err){alert('Import error: '+err.message)}
  }
  reader.readAsText(file)
}

function exportCSV(){
  const rows = [['term','meaning','notes','level','nextReview']]
  vocab.forEach(w=>rows.push([w.term,w.meaning,w.notes||'',w.level||0,w.nextReview||0]))
  const csv = rows.map(r=>r.map(c=>`"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='serbian_vocab.csv'; a.click(); URL.revokeObjectURL(url)
}

// UI wiring
document.addEventListener('DOMContentLoaded',()=>{
  loadVocab(); renderList();
  // populate voices (may be async)
  if(window.speechSynthesis){
    const sel = document.getElementById('voiceSelect')
    const saved = getSavedVoiceName()
    // populate now and also after voiceschanged
    populateVoices()
    window.speechSynthesis.onvoiceschanged = () => populateVoices()
    // when user changes selection, save it
    sel.addEventListener('change', e=>{ saveVoiceName(e.target.value) })
  }
  document.getElementById('addForm').addEventListener('submit',e=>{
    e.preventDefault(); const term=document.getElementById('term').value.trim(); const meaning=document.getElementById('meaning').value.trim(); const notes=document.getElementById('notes').value.trim(); if(!term||!meaning) return; addWord(term,meaning,notes); e.target.reset()
  })
  document.getElementById('startReviewBtn').addEventListener('click',()=>{ buildReviewQueue(); showCard(); })
  document.getElementById('showBackBtn').addEventListener('click',()=>{ document.getElementById('back').classList.toggle('visible'); alert(document.getElementById('back').textContent) })
  document.getElementById('speakBtn').addEventListener('click',()=>{ const t=document.getElementById('front').textContent; speak(t) })
  document.getElementById('correctBtn').addEventListener('click',()=>markAnswer(true))
  document.getElementById('wrongBtn').addEventListener('click',()=>markAnswer(false))
  document.getElementById('exportBtn').addEventListener('click',exportJSON)
  document.getElementById('csvBtn').addEventListener('click',exportCSV)
  document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('fileInput').click())
  document.getElementById('fileInput').addEventListener('change',e=>{ const f=e.target.files[0]; if(f) importJSONFile(f) })
})
