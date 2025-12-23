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
// Recording removed: app uses uploaded audio or TTS only

// Note: review/SRS functionality removed — app focuses on word management and per-word pronunciation

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
    // play: pronounce via TTS
    const play = document.createElement('button')
    play.textContent='🔊'
    play.onclick = ()=> playAudio(w)

    // edit button
    const editBtn = document.createElement('button')
    editBtn.textContent = 'Edit'
    editBtn.onclick = ()=> startEditForIndex(i, li)

    // show only pronounce and edit buttons to keep per-word UI simple
    right.append(play, editBtn)
    li.append(left,right)
    ul.append(li)
  })
}

function startEditForIndex(index, li){
  const w = vocab[index]
  if(!w) return
  // left side becomes an inline edit form
  const left = li.querySelector('div')
  left.innerHTML = ''
  const termIn = document.createElement('input')
  termIn.value = w.term || ''
  const meanIn = document.createElement('input')
  meanIn.value = w.meaning || ''
  const notesIn = document.createElement('input')
  notesIn.value = w.notes || ''
  termIn.style.marginRight = '6px'
  meanIn.style.marginRight = '6px'
  notesIn.style.marginRight = '6px'
  left.append(termIn, meanIn, notesIn)
  const save = document.createElement('button')
  save.textContent = 'Save'
  const cancel = document.createElement('button')
  cancel.textContent = 'Cancel'
  left.append(save, cancel)

  save.onclick = ()=>{
    const term = termIn.value.trim(); const meaning = meanIn.value.trim(); const notes = notesIn.value.trim();
    if(!term || !meaning){ alert('Term and meaning required'); return }
    vocab[index].term = term
    vocab[index].meaning = meaning
    vocab[index].notes = notes
    vocab[index].modified = Date.now()
    saveVocab()
    renderList()
  }
  cancel.onclick = ()=>{ renderList() }
}

function playAudio(w){
  // Always use TTS pronounce for simplicity
  speak(w.term)
}

// Recording was removed to simplify the app; use Upload for per-word audio.

function addWord(term,meaning,notes){
  vocab.unshift(attachMeta({term,meaning,notes}))
  saveVocab()
}

// Review queue: pick items due now (nextReview <= now) or all if none due
// review functions removed

function speak(text){
  if(!window.speechSynthesis) return alert('Speech synthesis not supported')
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  // ask engine to use Serbian pronunciation
  utter.lang = 'sr-RS'
  // Attempt to use the preferred Serbian/Slovenian voice if available
  try{
    const voices = window.speechSynthesis.getVoices() || []
    // prefer voices whose lang starts with 'sr' or 'sl'
    let preferred = voices.find(v => /^sr(-|$)/i.test(v.lang) || /^sl(-|$)/i.test(v.lang))
    // if none found, try matching by name hints
    if(!preferred) preferred = voices.find(v => /serbian|slovenian|srpski|slovenski/i.test(v.name))
    // fall back to saved voice name if present
    const saved = getSavedVoiceName()
    if(!preferred && saved){ preferred = voices.find(v=>v.name===saved) }
    if(preferred) utter.voice = preferred
  }catch(e){ console.warn('voice selection error', e) }
  speechSynthesis.cancel()
  speechSynthesis.speak(utter)
}

// Voice selection helpers: prefer Serbian/Slovenian voices and persist the chosen name
const VOICE_STORAGE_KEY = 'servian_preferred_voice'
function saveVoiceName(name){ try{ localStorage.setItem(VOICE_STORAGE_KEY, name) }catch(e){} }
function getSavedVoiceName(){ try{ return localStorage.getItem(VOICE_STORAGE_KEY) }catch(e){ return null } }

function populateVoices(){
  const sel = document.getElementById('voiceSelect')
  if(!sel || !window.speechSynthesis) return
  const voices = window.speechSynthesis.getVoices() || []
  sel.innerHTML = ''
  voices.forEach(v=>{
    const opt = document.createElement('option')
    opt.value = v.name
    opt.textContent = `${v.name} (${v.lang})`
    sel.appendChild(opt)
  })
  // pick preferred sr/sl voice
  let preferred = voices.find(v => /^sr(-|$)/i.test(v.lang) || /^sl(-|$)/i.test(v.lang))
  if(!preferred) preferred = voices.find(v => /serbian|slovenian|srpski|slovenski/i.test(v.name))
  const saved = getSavedVoiceName()
  if(!preferred && saved){ preferred = voices.find(v=>v.name===saved) }
  if(preferred){
    // select it and lock selection so pronunciation stays consistent
    sel.value = preferred.name
    sel.disabled = true
    saveVoiceName(preferred.name)
  } else {
    // no preferred voice available; keep selector enabled so user can pick if they want
    if(saved && voices.find(v=>v.name===saved)) sel.value = saved
    sel.disabled = false
  }
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
  // Review UI removed — keep word list controls only
  document.getElementById('exportBtn').addEventListener('click',exportJSON)
  document.getElementById('csvBtn').addEventListener('click',exportCSV)
  document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('fileInput').click())
  document.getElementById('fileInput').addEventListener('change',e=>{ const f=e.target.files[0]; if(f) importJSONFile(f) })
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(err => console.error('SW registration failed', err))
  })
}

