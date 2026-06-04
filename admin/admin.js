// ═══════════════════════════════════════════════
//  halfsentence · admin.js
//  Admin panel logic + Supabase operations
// ═══════════════════════════════════════════════

import { supabase } from '/js/supabase.js'

// ── Auth guard (runs on every admin page) ────────────────
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { window.location.href = '/admin/index.html'; return null }
  return session
}

// ── Toast ────────────────────────────────────────────────
export function toast(msg, duration = 2200) {
  let el = document.getElementById('toast')
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el) }
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(window._toastTimer)
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration)
}

function spinner() { return '<div class="spinner"></div>' }

// ── Navigation (panels) ──────────────────────────────────
export function navTo(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))
  const panel = document.getElementById('panel-' + id)
  if (panel) panel.classList.add('active')
  if (btn) {
    document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'))
    btn.classList.add('active')
  }
  const titles = {
    dashboard:'Dashboard', posts:'All Posts', editor:'New Post',
    drafts:'Drafts', scheduled:'Scheduled', media:'Media Library',
    comments:'Comments', readers:"Readers' Corner", settings:'Settings'
  }
  const titleEl = document.getElementById('topbar-title')
  if (titleEl) titleEl.textContent = titles[id] || ''
  document.querySelector('.admin-content')?.scrollTo(0, 0)
}
window.navTo = navTo

// ── DASHBOARD STATS ──────────────────────────────────────
export async function loadDashboard() {
  // Posts count
  const { count: postCount } = await supabase
    .from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published')

  // Total views
  const { data: viewsData } = await supabase.from('posts').select('views').eq('status', 'published')
  const totalViews = viewsData?.reduce((s, p) => s + (p.views || 0), 0) || 0

  // Reactions
  const { count: likeCount } = await supabase
    .from('reactions').select('*', { count: 'exact', head: true }).eq('type', 'like')
  const { count: hateCount } = await supabase
    .from('reactions').select('*', { count: 'exact', head: true }).eq('type', 'hate')

  // Comments
  const { count: commentCount } = await supabase
    .from('comments').select('*', { count: 'exact', head: true })

  // Update stat cards
  setEl('stat-views',    totalViews.toLocaleString())
  setEl('stat-likes',    (likeCount || 0).toLocaleString())
  setEl('stat-comments', (commentCount || 0).toLocaleString())
  setEl('stat-posts',    (postCount || 0).toLocaleString())

  // Top posts
  const { data: topPosts } = await supabase
    .from('posts').select('title, views')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(5)

  renderTopPosts(topPosts || [])

  // Update donut counts
  setEl('donut-likes',    (likeCount || 0).toLocaleString())
  setEl('donut-hates',    (hateCount || 0).toLocaleString())
  setEl('donut-comments', (commentCount || 0).toLocaleString())
}

function renderTopPosts(posts) {
  const tbody = document.getElementById('top-posts-body')
  if (!tbody) return
  if (!posts.length) { tbody.innerHTML = '<tr><td colspan="2" style="color:var(--ink-l);font-size:13px;padding:12px 0">No posts yet</td></tr>'; return }
  const max = posts[0]?.views || 1
  tbody.innerHTML = posts.map(p => `
    <tr>
      <td class="tt-title" title="${p.title}">${p.title}</td>
      <td>
        <div class="tt-bar-wrap">
          <div class="tt-bar"><div class="tt-bar-inner" style="width:${((p.views||0)/max*100).toFixed(0)}%"></div></div>
          <span class="tt-num">${(p.views||0).toLocaleString()}</span>
        </div>
      </td>
    </tr>`).join('')
}

// ── ALL POSTS ────────────────────────────────────────────
export async function loadPosts(filter = {}) {
  const tbody = document.getElementById('posts-tbody')
  if (!tbody) return
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px">${spinner()}</td></tr>`

  let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (filter.status) query = query.eq('status', filter.status)
  if (filter.search) query = query.ilike('title', `%${filter.search}%`)

  const { data: posts, error } = await query
  if (error) { console.error(error); return }

  const countEl = document.getElementById('post-count')
  if (countEl) countEl.textContent = (posts?.length || 0) + ' posts'

  if (!posts?.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--ink-l)">No posts found</td></tr>'
    return
  }

  // Get reaction counts
  const ids = posts.map(p => p.id)
  const { data: reactions } = await supabase.from('reactions').select('post_id,type').in('post_id', ids)
  const likesMap = {}, hatesMap = {}
  ids.forEach(id => { likesMap[id] = 0; hatesMap[id] = 0 })
  reactions?.forEach(r => { if (r.type === 'like') likesMap[r.post_id]++; else hatesMap[r.post_id]++ })

  tbody.innerHTML = posts.map(p => `
    <tr>
      <td style="padding:10px 0">
        <div class="post-cell">
          <div class="post-thumb">
            ${p.cover_url ? `<img src="${p.cover_url}" alt=""/>` : '📝'}
          </div>
          <div>
            <div class="post-name" title="${p.title}">${p.title}</div>
            <div class="post-sub">${p.excerpt || p.category || ''}</div>
          </div>
        </div>
      </td>
      <td style="font-size:12px;color:var(--ink-m)">${p.category || '—'}</td>
      <td><span class="status-pill ${p.status==='published'?'sp-pub':p.status==='draft'?'sp-draft':'sp-sched'}">${p.status}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--ink-m)">${(p.views||0).toLocaleString()}</td>
      <td style="font-size:12px;color:var(--ink-m)">👍${likesMap[p.id]} 👎${hatesMap[p.id]}</td>
      <td style="font-size:11px;color:var(--ink-l);white-space:nowrap">${formatDate(p.created_at)}</td>
      <td>
        <div class="row-actions">
          <button class="ra ra-edit" onclick="editPost('${p.id}')">Edit</button>
          <button class="ra ra-del"  onclick="confirmDelete('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>`).join('')
}

// ── EDITOR ───────────────────────────────────────────────
let editingId = null
const tagsList = []

export async function editPost(id) {
  editingId = id
  navTo('editor', null)
  document.querySelectorAll('.sb-item').forEach(i => { if (i.textContent.includes('New Post')) i.classList.add('active') })

  const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single()
  if (error || !post) { toast('❌ Could not load post'); return }

  setVal('ed-title',   post.title || '')
  setVal('ed-cat',     post.category || '')
  setVal('ed-excerpt', post.excerpt || '')
  setVal('ed-slug',    post.slug || '')
  const rte = document.getElementById('rte')
  if (rte) rte.innerHTML = post.body || ''

  // Tags
  tagsList.length = 0
  post.tags?.forEach(t => addTagToUI(t))

  // Cover
  if (post.cover_url) {
    const img = document.getElementById('cover-preview')
    const ph  = document.getElementById('cz-ph')
    const inf = document.getElementById('cover-info')
    const rem = document.getElementById('cover-remove')
    if (img) { img.src = post.cover_url; img.style.display = 'block' }
    if (ph)  ph.style.display  = 'none'
    if (inf) { inf.style.display = 'block'; inf.textContent = 'Current cover image' }
    if (rem) rem.style.display = 'block'
  }

  updateWordCount()
  toast('Post loaded into editor')
}
window.editPost = editPost

export async function savePost(status) {
  const title   = getVal('ed-title')
  const body    = document.getElementById('rte')?.innerHTML || ''
  const cat     = getVal('ed-cat')
  const excerpt = getVal('ed-excerpt')
  const slug    = getVal('ed-slug') || slugify(title)

  if (!title) { toast('⚠️ Add a title first'); return }

  const schedDate = getVal('sched-date')
  const schedTime = getVal('sched-time') || '09:00'
  const scheduledAt = (status === 'scheduled' && schedDate)
    ? new Date(schedDate + 'T' + schedTime).toISOString()
    : null

  const payload = {
    title, body, category: cat, excerpt,
    slug, tags: tagsList, status,
    ...(scheduledAt ? { scheduled_at: scheduledAt } : {})
  }

  let error
  if (editingId) {
    ({ error } = await supabase.from('posts').update(payload).eq('id', editingId))
  } else {
    const res = await supabase.from('posts').insert(payload).select().single()
    error = res.error
    if (res.data) editingId = res.data.id
  }

  if (error) { toast('❌ Save failed: ' + error.message); return }

  const msgs = { published: '🎉 Published!', draft: '💾 Saved as draft', scheduled: '🗓 Scheduled!' }
  toast(msgs[status] || '✅ Saved')

  if (status === 'published') {
    setTimeout(() => { navTo('posts', null); loadPosts() }, 1200)
  }
}
window.savePost = savePost

// ── COVER IMAGE ──────────────────────────────────────────
export async function uploadCover(file) {
  if (!file || !file.type.startsWith('image/')) {
    toast('⚠️ Please upload a valid image (JPG, PNG, WEBP, GIF, SVG, AVIF)')
    return null
  }
  const ext      = file.name.split('.').pop()
  const filename = `covers/${Date.now()}.${ext}`

  toast('Uploading cover…')
  const { error: upErr } = await supabase.storage.from('covers').upload(filename, file, { upsert: true })
  if (upErr) { toast('❌ Upload failed: ' + upErr.message); return null }

  const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(filename)

  // Save to post if editing
  if (editingId) {
    await supabase.from('posts').update({ cover_url: publicUrl }).eq('id', editingId)
  }

  toast('✅ Cover uploaded!')
  return publicUrl
}

export function setCoverPreview(file) {
  const url = URL.createObjectURL(file)
  const img = document.getElementById('cover-preview')
  const ph  = document.getElementById('cz-ph')
  const inf = document.getElementById('cover-info')
  const rem = document.getElementById('cover-remove')
  if (img) { img.src = url; img.style.display = 'block' }
  if (ph)  ph.style.display  = 'none'
  if (inf) { inf.style.display = 'block'; inf.textContent = file.name + ' · ' + (file.size/1024).toFixed(0) + ' KB' }
  if (rem) rem.style.display = 'block'
}

window.removeCover = () => {
  const img = document.getElementById('cover-preview')
  const ph  = document.getElementById('cz-ph')
  const inf = document.getElementById('cover-info')
  const rem = document.getElementById('cover-remove')
  const inp = document.getElementById('cover-inp')
  if (img) { img.src = ''; img.style.display = 'none' }
  if (ph)  ph.style.display  = 'block'
  if (inf) inf.style.display = 'none'
  if (rem) rem.style.display = 'none'
  if (inp) inp.value = ''
}

// ── FILE IMPORT ──────────────────────────────────────────
export function importFile(file) {
  if (!file) return
  if (file.name.endsWith('.docx')) {
    document.getElementById('rte').innerHTML =
      `<h2>${file.name.replace('.docx','').replace(/[-_]/g,' ')}</h2>` +
      `<p>Your Word document was imported here. Edit freely before publishing.</p>`
    setVal('ed-title', file.name.replace('.docx','').replace(/[-_]/g,' '))
    toast('✅ Word doc imported!')
  } else {
    const r = new FileReader()
    r.onload = ev => {
      const lines = ev.target.result.split('\n')
      const title = lines[0].replace(/^#+\s*/,'').trim()
      if (title) setVal('ed-title', title)
      const body = lines.slice(1).join('\n').trim()
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/\n\n+/g,'</p><p>')
      document.getElementById('rte').innerHTML = '<p>' + body + '</p>'
      toast('✅ File imported!')
    }
    r.readAsText(file)
  }
  updateWordCount()
}
window.importFile = importFile

// ── TAGS ─────────────────────────────────────────────────
export function addTagKey(e) {
  if (e.key !== 'Enter' && e.key !== ',') return
  e.preventDefault()
  const val = e.target.value.trim().replace(/,$/,'')
  if (!val || tagsList.includes(val)) { e.target.value = ''; return }
  addTagToUI(val)
  e.target.value = ''
}
window.addTagKey = addTagKey

function addTagToUI(val) {
  if (tagsList.includes(val)) return
  tagsList.push(val)
  const wrap = document.getElementById('tags-wrap')
  if (!wrap) return
  const chip = document.createElement('div')
  chip.className = 'tag-chip'
  chip.dataset.tag = val
  chip.innerHTML = val + `<button onclick="removeTag('${val}')">×</button>`
  wrap.appendChild(chip)
}

window.removeTag = (val) => {
  const i = tagsList.indexOf(val)
  if (i > -1) tagsList.splice(i, 1)
  document.querySelector(`.tag-chip[data-tag="${val}"]`)?.remove()
}

// ── SCHEDULE TOGGLE ──────────────────────────────────────
window.toggleSchedule = () => {
  const picker = document.getElementById('sched-picker')
  if (!picker) return
  const open = picker.style.display === 'block'
  picker.style.display = open ? 'none' : 'block'
  if (!open) {
    const d = new Date(); d.setDate(d.getDate() + 7)
    setVal('sched-date', d.toISOString().split('T')[0])
  }
}

// ── WORD COUNT ───────────────────────────────────────────
export function updateWordCount() {
  const rte = document.getElementById('rte')
  const wc  = document.getElementById('rte-wc')
  if (!rte || !wc) return
  const txt   = rte.innerText.trim()
  const words = txt ? txt.split(/\s+/).length : 0
  const mins  = Math.max(1, Math.ceil(words / 200))
  wc.textContent = words + ' words · ' + mins + ' min read'
}
window.updateWordCount = updateWordCount

// ── COMMENTS ─────────────────────────────────────────────
export async function loadComments() {
  const tbody = document.getElementById('comments-tbody')
  if (!tbody) return
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px">${spinner()}</td></tr>`

  const { data: comments, error } = await supabase
    .from('comments')
    .select('*, posts(title)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }

  const colors = ['#6B9E7A','#7A8AAE','#C47A6B','#9B7CC0','#8AAD82']

  tbody.innerHTML = (comments || []).map((c, i) => `
    <tr>
      <td style="padding:10px 0">
        <div class="comm-user">
          <div class="comm-av" style="background:${colors[i%colors.length]}">${(c.author||'?')[0].toUpperCase()}</div>
          <span style="font-weight:500;font-size:13px">${c.author || 'Anonymous'}</span>
        </div>
      </td>
      <td><div class="comm-preview">${c.body}</div></td>
      <td style="font-size:12px;color:var(--ink-m);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.posts?.title || '—'}</td>
      <td><span class="status-pill ${c.status==='approved'?'cs-approved':c.status==='spam'?'cs-spam':'cs-pending'}">${c.status}</span></td>
      <td style="font-size:11px;color:var(--ink-l);font-family:'JetBrains Mono',monospace;white-space:nowrap">${formatDate(c.created_at)}</td>
      <td>
        <div class="row-actions">
          ${c.status !== 'approved' ? `<button class="ra ra-edit" onclick="approveComment('${c.id}')">Approve</button>` : ''}
          <button class="ra ra-del" onclick="confirmDeleteComment('${c.id}')">Delete</button>
        </div>
      </td>
    </tr>`).join('')
}

window.approveComment = async (id) => {
  const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id)
  if (!error) { toast('✅ Comment approved'); loadComments() }
}

// ── DELETE ────────────────────────────────────────────────
let deleteId = null, deleteType = null

export function confirmDelete(id, type = 'post') {
  deleteId   = id
  deleteType = type
  document.getElementById('confirm-overlay')?.classList.add('open')
}
window.confirmDelete        = confirmDelete
window.confirmDeleteComment = (id) => confirmDelete(id, 'comment')

window.closeConfirm = () => document.getElementById('confirm-overlay')?.classList.remove('open')

window.doDelete = async () => {
  window.closeConfirm()
  if (!deleteId) return
  const table = deleteType === 'comment' ? 'comments' : 'posts'
  const { error } = await supabase.from(table).delete().eq('id', deleteId)
  if (error) { toast('❌ Delete failed'); return }
  toast('🗑 Deleted')
  if (deleteType === 'comment') loadComments()
  else loadPosts()
}

// ── PREVIEW ───────────────────────────────────────────────
window.openPreview = () => {
  const title   = getVal('ed-title') || 'Untitled'
  const cat     = getVal('ed-cat')   || 'Draft'
  const body    = document.getElementById('rte')?.innerHTML || ''
  const coverSrc = document.getElementById('cover-preview')?.src || ''
  const wc      = document.getElementById('rte-wc')?.textContent || ''

  setEl('mprev-cat',   cat)
  setEl('mprev-title', title)
  setEl('mprev-meta',  'Preview · ' + wc)

  const cvEl = document.getElementById('mprev-cover')
  if (cvEl) { cvEl.style.display = (coverSrc && !coverSrc.endsWith('#')) ? 'block' : 'none'; cvEl.src = coverSrc }

  const bodyEl = document.getElementById('mprev-body')
  if (bodyEl) bodyEl.innerHTML = body || '<p style="color:var(--ink-l);font-style:italic">Nothing written yet.</p>'

  document.getElementById('prev-modal')?.classList.add('open')
  document.body.style.overflow = 'hidden'
}
window.closePreview = () => {
  document.getElementById('prev-modal')?.classList.remove('open')
  document.body.style.overflow = ''
}

// ── MEDIA ────────────────────────────────────────────────
export async function loadMedia() {
  const grid = document.getElementById('media-grid')
  if (!grid) return
  grid.innerHTML = spinner()

  const { data, error } = await supabase.storage.from('covers').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) { console.error(error); grid.innerHTML = '<div style="color:var(--ink-l);font-size:13px;padding:20px">Could not load media.</div>'; return }

  if (!data?.length) {
    grid.innerHTML = '<div style="color:var(--ink-l);font-size:13px;padding:20px">No media uploaded yet.</div>'
    return
  }

  grid.innerHTML = data.map(f => {
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(f.name)
    const isImg = /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(f.name)
    return `
      <div class="media-item" onclick="this.classList.toggle('selected')">
        <div class="media-thumb">
          ${isImg ? `<img src="${publicUrl}" alt="${f.name}" loading="lazy"/>` : '📄'}
        </div>
        <div class="media-name" title="${f.name}">${f.name}</div>
        <div class="media-size">${f.metadata?.size ? (f.metadata.size/1024).toFixed(0)+' KB' : ''}</div>
      </div>`
  }).join('')
}

// ── SETTINGS ─────────────────────────────────────────────
export async function saveSettings() {
  // You can store settings in a Supabase 'settings' table
  // For now just show a toast
  toast('✅ Settings saved')
}
window.saveSettings = saveSettings

// ── READERS CORNER ADMIN ─────────────────────────────────
export async function loadReadersAdmin() {
  const tbody = document.getElementById('readers-tbody')
  if (!tbody) return
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px">${spinner()}</td></tr>`

  const { data: posts, error } = await supabase
    .from('readers_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return }

  const flairMap = { review:'Review', discussion:'Discussion', recommendation:'Rec' }
  const flairStyle = {
    review: 'background:#f0eeff;color:#5b3fa5',
    discussion: 'background:#e8f3ff;color:#1a5fa0',
    recommendation: 'background:#eaf4ed;color:#2d7048'
  }

  tbody.innerHTML = (posts || []).map(p => `
    <tr>
      <td style="padding:10px 0">
        <div class="post-name" style="max-width:280px">${p.title}</div>
      </td>
      <td><span class="status-pill" style="${flairStyle[p.type]||''}">${flairMap[p.type]||p.type}</span></td>
      <td style="font-size:12px;color:var(--ink-m)">${p.author || 'Anonymous'}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--sage)">↑${p.votes||0}</td>
      <td style="font-size:12px;color:var(--ink-l);white-space:nowrap">${formatDate(p.created_at)}</td>
      <td>
        <div class="row-actions">
          <button class="ra ra-del" onclick="confirmDelete('${p.id}','reader')">Remove</button>
        </div>
      </td>
    </tr>`).join('')
}

// ── LOGIN ─────────────────────────────────────────────────
export async function login(email, password) {
  const btn = document.getElementById('login-btn')
  const err = document.getElementById('login-error')
  if (btn)  btn.textContent = 'Signing in…'
  if (err)  err.textContent = ''

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (btn) btn.textContent = 'Sign in'
    if (err) {
      const msg = error.message || ''
      if (msg.toLowerCase().includes('email not confirmed'))
        err.textContent = 'Email not confirmed. In Supabase → Authentication → Users, confirm the user or turn off “Confirm email”.'
      else if (msg.toLowerCase().includes('invalid login'))
        err.textContent = 'Invalid email or password. Use a user created in Supabase with a password (not invite-only).'
      else
        err.textContent = msg || 'Sign-in failed. Check the browser console (F12) for details.'
    }
    console.error('Login error:', error)
    return
  }
  window.location.href = '/admin/dashboard.html'
}
window.login = login

export async function logout() {
  await supabase.auth.signOut()
  window.location.href = '/admin/index.html'
}
window.logout = logout

// ── Rich text editor ─────────────────────────────────────
window.rfmt = (cmd, val) => {
  document.getElementById('rte')?.focus()
  document.execCommand(cmd, false, val || null)
}
window.rLink = () => { const u = prompt('Enter URL:'); if (u) window.rfmt('createLink', u) }

// ── Helpers ──────────────────────────────────────────────
function setEl(id, text)  { const e = document.getElementById(id); if (e) e.textContent = text }
function setVal(id, val)  { const e = document.getElementById(id); if (e) e.value = val }
function getVal(id)       { return document.getElementById(id)?.value?.trim() || '' }
function slugify(str)     { return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') }
function formatDate(iso)  { return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }

export { setEl, setVal, getVal, slugify, formatDate }
