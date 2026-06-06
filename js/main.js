// ═══════════════════════════════════════════════
//  halfsentence · main.js
// ═══════════════════════════════════════════════

import { supabase } from './supabase.js'

// ── Helpers ──────────────────────────────────────────────
export function toast(msg, duration = 2200) {
  let el = document.getElementById('toast')
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el) }
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(window._toastTimer)
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration)
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function readTime(body) {
  const words = (body || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200)) + ' min read'
}

function spinner() {
  return '<div class="spinner"></div>'
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function avatarColor(name) {
  const colors = ['#A07890','#7A8AAE','#8AAD82','#C47A6B','#9B7CC0','#A07AB5','#6BA3AE']
  let h = 0; for (let c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

function isFullHtml(body) {
  if (!body) return false
  const t = body.trim().toLowerCase()
  return t.startsWith('<!doctype') || t.startsWith('<html')
}

window.openHtmlPost = function() {
  const html = window._htmlPostBody
  if (!html) return
  const blob = new Blob([html], { type: 'text/html' })
  window.location.href = URL.createObjectURL(blob)
}

// ── Category helpers ──────────────────────────────────────
function catClass(category) {
  const c = (category || '').toLowerCase()
  if (c.includes('phil'))                        return 'cat-philosophy'
  if (c.includes('book') || c.includes('read')) return 'cat-books'
  if (c.includes('cult'))                        return 'cat-culture'
  if (c.includes('pers'))                        return 'cat-personal'
  if (c.includes('tech'))                        return 'cat-technology'
  return 'cat-default'
}

function catIcon(category) {
  const c = (category || '').toLowerCase()
  if (c.includes('phil')) return `
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="14" stroke="#7060A8" stroke-width="1.5" opacity="0.4"/>
      <circle cx="26" cy="26" r="8"  stroke="#7060A8" stroke-width="1.5" opacity="0.6"/>
      <circle cx="26" cy="26" r="2.5" fill="#7060A8" opacity="0.8"/>
      <line x1="26" y1="8"  x2="26" y2="12" stroke="#7060A8" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <line x1="26" y1="40" x2="26" y2="44" stroke="#7060A8" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <line x1="8"  y1="26" x2="12" y2="26" stroke="#7060A8" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <line x1="40" y1="26" x2="44" y2="26" stroke="#7060A8" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
    </svg>`
  if (c.includes('book') || c.includes('read')) return `
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="18" height="30" rx="2" stroke="#2A6A8A" stroke-width="1.5" opacity="0.5"/>
      <rect x="22" y="10" width="18" height="30" rx="2" stroke="#2A6A8A" stroke-width="1.5" opacity="0.3"/>
      <line x1="14" y1="18" x2="24" y2="18" stroke="#2A6A8A" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <line x1="14" y1="22" x2="24" y2="22" stroke="#2A6A8A" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
      <line x1="14" y1="26" x2="20" y2="26" stroke="#2A6A8A" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
    </svg>`
  if (c.includes('cult')) return `
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 10 L40 36 L12 36 Z" stroke="#8A5A2A" stroke-width="1.5" stroke-linejoin="round" opacity="0.45"/>
      <path d="M26 18 L36 36 L16 36 Z" stroke="#8A5A2A" stroke-width="1.2" stroke-linejoin="round" opacity="0.28"/>
      <circle cx="26" cy="10" r="2" fill="#8A5A2A" opacity="0.5"/>
    </svg>`
  if (c.includes('pers')) return `
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 12 C26 12 15 21 15 30 C15 36.1 20 41 26 41 C32 41 37 36.1 37 30 C37 21 26 12 26 12Z" stroke="#2A6A4A" stroke-width="1.5" opacity="0.45"/>
      <path d="M26 20 C26 20 19 26 19 31 C19 34.5 22.1 37.5 26 37.5" stroke="#2A6A4A" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>
    </svg>`
  if (c.includes('tech')) return `
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="16" width="32" height="22" rx="2" stroke="#6A5A3A" stroke-width="1.5" opacity="0.45"/>
      <line x1="17" y1="38" x2="35" y2="38" stroke="#6A5A3A" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
      <line x1="26" y1="38" x2="26" y2="42" stroke="#6A5A3A" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
      <circle cx="26" cy="27" r="4.5" stroke="#6A5A3A" stroke-width="1.2" opacity="0.45"/>
      <circle cx="26" cy="27" r="1.5" fill="#6A5A3A" opacity="0.5"/>
    </svg>`
  return `
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="14" width="28" height="26" rx="3" stroke="#7A6A7A" stroke-width="1.5" opacity="0.4"/>
      <line x1="18" y1="22" x2="34" y2="22" stroke="#7A6A7A" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
      <line x1="18" y1="27" x2="34" y2="27" stroke="#7A6A7A" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
      <line x1="18" y1="32" x2="26" y2="32" stroke="#7A6A7A" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
    </svg>`
}

// ── CURRENTLY READING ────────────────────────────────────
export async function loadCurrentlyReading() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('currently_reading_book, currently_reading_author, currently_reading_quote, currently_reading_progress')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) {
    setTimeout(() => {
      const bar = document.getElementById('rc-bar-fill')
      if (bar) bar.style.width = '34%'
    }, 500)
    return
  }

  const titleEl  = document.getElementById('rc-book-title')
  const authorEl = document.getElementById('rc-book-author')
  const quoteEl  = document.getElementById('rc-quote')
  const attrEl   = document.getElementById('rc-attr')
  const pctEl    = document.getElementById('rc-pct')
  const barEl    = document.getElementById('rc-bar-fill')

  if (titleEl  && data.currently_reading_book)   titleEl.textContent  = data.currently_reading_book
  if (authorEl && data.currently_reading_author) authorEl.textContent = data.currently_reading_author
  if (quoteEl  && data.currently_reading_quote)  quoteEl.textContent  = '"' + data.currently_reading_quote + '"'
  if (attrEl   && data.currently_reading_author) attrEl.textContent   = '— ' + data.currently_reading_author
  if (pctEl)   pctEl.textContent = (data.currently_reading_progress || 0) + '%'

  setTimeout(() => {
    if (barEl) barEl.style.width = (data.currently_reading_progress || 0) + '%'
  }, 500)
}

// ── HOME PAGE ────────────────────────────────────────────
export async function loadHome() {
  const postsWrap = document.getElementById('posts-wrap')
  if (!postsWrap) return
  postsWrap.innerHTML = spinner()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, excerpt, cover_url, category, tags, views, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) { console.error(error); return }

  if (!posts || posts.length === 0) {
    postsWrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✍️</div><div class="empty-state-text">No posts yet. Check back soon.</div></div>'
    return
  }

  const ids = posts.map(p => p.id)
  const { data: reactions } = await supabase.from('reactions').select('post_id, type').in('post_id', ids)
  const { data: comments  } = await supabase.from('comments').select('post_id').in('post_id', ids).eq('status', 'approved')

  const likesMap = {}, hatesMap = {}, commentsMap = {}
  ids.forEach(id => { likesMap[id] = 0; hatesMap[id] = 0; commentsMap[id] = 0 })
  reactions?.forEach(r => { if (r.type === 'like') likesMap[r.post_id]++; else hatesMap[r.post_id]++ })
  comments?.forEach(c => { commentsMap[c.post_id]++ })

  postsWrap.innerHTML = posts.map(p => {
    const cc   = catClass(p.category)
    const icon = catIcon(p.category)
    const coverHtml = p.cover_url
      ? `<img src="${escapeHtml(p.cover_url)}" alt="${escapeHtml(p.title)}"/>`
      : icon

    return `
    <div class="post-card fade-up" onclick="window.location.href='post.html?id=${p.id}'">
      <div class="post-card-cover ${cc}">
        <div class="post-card-cover-label">${escapeHtml(p.category || '')}</div>
        ${coverHtml}
      </div>
      <div class="post-card-body">
        <div class="post-card-top">
          <span class="post-card-cat">${escapeHtml(p.category || 'Essay')}</span>
          <span class="post-card-date">${formatDate(p.created_at)}</span>
        </div>
        <div class="post-card-title">${escapeHtml(p.title)}</div>
        <div class="post-card-excerpt">${escapeHtml(p.excerpt || '')}</div>
        <div class="post-card-footer">
          <span class="post-card-stat">👍 ${likesMap[p.id]}</span>
          <span class="post-card-stat">💬 ${commentsMap[p.id]}</span>
          <span class="post-card-time">${readTime(p.excerpt)}</span>
        </div>
      </div>
    </div>`
  }).join('')
}

// ── SINGLE POST ──────────────────────────────────────────
export async function loadPost() {
  const params = new URLSearchParams(window.location.search)
  const id     = params.get('id')
  const slug   = params.get('slug')
  const wrap   = document.getElementById('post-wrap')
  if (!wrap) return

  if (!id && !slug) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No post selected. <a href="index.html">Back to home</a></div></div>'
    return
  }

  wrap.innerHTML = spinner()

  try {
    let query = supabase.from('posts').select('*').eq('status', 'published')
    if (id) query = query.eq('id', id)
    else    query = query.eq('slug', slug)

    const { data: post, error } = await query.single()

    if (error || !post) {
      wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Post not found.</div></div>'
      return
    }

    const postId   = post.id
    const htmlPost = isFullHtml(post.body)

    const { data: reactions } = await supabase.from('reactions').select('type').eq('post_id', postId)
    const likes = reactions?.filter(r => r.type === 'like').length || 0
    const hates = reactions?.filter(r => r.type === 'hate').length || 0

    const { data: comments } = await supabase
      .from('comments').select('*')
      .eq('post_id', postId).eq('status', 'approved')
      .order('created_at', { ascending: true })

    document.title = escapeHtml(post.title) + ' · halfsentence'

    wrap.innerHTML = `
    <div class="post-page fade-up">
      <button class="post-back" onclick="window.location.href='index.html'">← All posts</button>
      <div class="post-cat">${escapeHtml(post.category || 'Essay')}</div>
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      <div class="post-byline">
        <span>halfsentence</span>
        <span class="post-byline-dot">·</span>
        <span>${formatDate(post.created_at)}</span>
        <span class="post-byline-dot">·</span>
        <span>${readTime(post.body)}</span>
        <span class="post-byline-dot">·</span>
        <span>${post.views || 0} views</span>
      </div>

      ${htmlPost
        ? `<div class="post-html-wrap" id="html-post-wrap"></div>`
        : `<div class="post-body">${post.body || ''}</div>`
      }

      <div class="reaction-bar">
        <span class="reaction-bar-q">Did this resonate?</span>
        <button class="reaction-big" id="like-btn" onclick="reactToPost('${postId}','like')">
          👍 Loved it <span class="reaction-count" id="like-count">${likes}</span>
        </button>
        <button class="reaction-big" id="hate-btn" onclick="reactToPost('${postId}','hate')">
          👎 Disagree <span class="reaction-count" id="hate-count">${hates}</span>
        </button>
      </div>

      <div class="comments-section">
        <div class="comments-title">
          Comments <span style="color:var(--ink-l);font-size:16px;font-weight:400">(${comments?.length || 0})</span>
        </div>
        <div class="comment-form">
          <input class="comment-form-name" id="comment-name" placeholder="Your name…" maxlength="60"/>
          <textarea class="comment-form-body" id="comment-body" placeholder="What are your thoughts?"></textarea>
          <div class="comment-form-footer">
            <button class="btn-submit" id="comment-submit" onclick="submitComment('${postId}')">Post comment</button>
          </div>
        </div>
        <div id="comments-list">${renderComments(comments || [])}</div>
      </div>
    </div>`

    if (htmlPost) {
      window._htmlPostBody = post.body
      const blob = new Blob([post.body], { type: 'text/html' })
      window.location.href = URL.createObjectURL(blob)
      return
    }

    if (post.tags?.length) {
      const tagsHtml = `<div style="margin-top:28px;display:flex;gap:8px;flex-wrap:wrap">
        ${post.tags.map(t => `<span style="font-size:12px;padding:4px 12px;border-radius:99px;border:1px solid var(--border);color:var(--ink-l)">${escapeHtml(t)}</span>`).join('')}
      </div>`
      const tagsTarget = wrap.querySelector('.post-body') || wrap.querySelector('.post-html-wrap')
      if (tagsTarget) tagsTarget.insertAdjacentHTML('afterend', tagsHtml)
    }

    supabase.rpc('increment_views', { post_id: postId }).then(() => {}).catch(() => {})

  } catch (err) {
    console.error('loadPost error:', err)
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Could not load this post. Please try again.</div></div>'
  }
}

function renderComments(comments) {
  if (!comments.length) return '<div class="empty-state" style="padding:30px 0"><div class="empty-state-text">No comments yet. Be the first!</div></div>'
  return comments.map(c => `
    <div class="comment-item">
      <div class="comment-head">
        <div class="comment-avatar" style="background:${avatarColor(c.author)}">${(c.author || '?')[0].toUpperCase()}</div>
        <div>
          <div class="comment-name">${escapeHtml(c.author || 'Anonymous')}</div>
          <div class="comment-date">${formatDate(c.created_at)}</div>
        </div>
      </div>
      <div class="comment-text">${escapeHtml(c.body)}</div>
    </div>`).join('')
}

// ── REACTIONS ────────────────────────────────────────────
let userReacted = null

export async function reactToPost(postId, type) {
  if (userReacted === type) {
    await supabase.from('reactions').delete()
      .eq('post_id', postId).eq('type', type).eq('session_id', getSession())
    userReacted = null
  } else {
    if (userReacted) await supabase.from('reactions').delete().eq('post_id', postId).eq('session_id', getSession())
    await supabase.from('reactions').insert({ post_id: postId, type, session_id: getSession() })
    userReacted = type
  }
  const { data: reactions } = await supabase.from('reactions').select('type').eq('post_id', postId)
  const likes = reactions?.filter(r => r.type === 'like').length || 0
  const hates = reactions?.filter(r => r.type === 'hate').length || 0
  document.getElementById('like-count').textContent = likes
  document.getElementById('hate-count').textContent = hates
  document.getElementById('like-btn').classList.toggle('liked', userReacted === 'like')
  document.getElementById('hate-btn').classList.toggle('hated', userReacted === 'hate')
  toast(type === 'like' ? '👍 Thanks!' : '👎 Noted!')
}

window.reactToPost = reactToPost

function getSession() {
  let s = localStorage.getItem('hs_session')
  if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem('hs_session', s) }
  return s
}

// ── COMMENTS ────────────────────────────────────────────
export async function submitComment(postId) {
  const name = document.getElementById('comment-name')?.value.trim()
  const body = document.getElementById('comment-body')?.value.trim()
  const btn  = document.getElementById('comment-submit')
  if (!name || !body) { toast('⚠️ Enter your name and comment'); return }

  btn.disabled = true; btn.textContent = 'Posting…'
  const { error } = await supabase.from('comments').insert({ post_id: postId, author: name, body, status: 'pending' })
  btn.disabled = false; btn.textContent = 'Post comment'

  if (error) { toast('❌ Something went wrong.'); return }
  document.getElementById('comment-name').value = ''
  document.getElementById('comment-body').value = ''
  toast('✅ Comment submitted! It will appear after review.')
}
window.submitComment = submitComment

// ── READERS CORNER ───────────────────────────────────────
export async function loadReadersCorner() {
  const feed = document.getElementById('readers-feed')
  if (!feed) return
  feed.innerHTML = spinner()

  const { data: posts, error } = await supabase
    .from('readers_posts').select('*').order('votes', { ascending: false })

  if (error) { console.error(error); return }
  if (!posts?.length) {
    feed.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">No posts yet. Be the first!</div></div>'
    return
  }

  const flairClass = { review: 'flair-review', discussion: 'flair-discuss', recommendation: 'flair-rec' }
  const flairLabel = { review: 'Book Review', discussion: 'Discussion', recommendation: 'Recommendation' }

  feed.innerHTML = posts.map(p => `
    <div class="reader-card">
      <div class="reader-votes">
        <button class="vote-btn" onclick="votePost('${p.id}', 1, this)">▲</button>
        <div class="vote-count" id="votes-${p.id}">${p.votes || 0}</div>
        <button class="vote-btn" onclick="votePost('${p.id}', -1, this)">▼</button>
      </div>
      <div class="reader-main">
        <span class="reader-flair ${flairClass[p.type] || 'flair-discuss'}">${flairLabel[p.type] || p.type}</span>
        <div class="reader-title">${escapeHtml(p.title)}</div>
        <div class="reader-preview">${escapeHtml((p.body || '').substring(0, 180))}${(p.body || '').length > 180 ? '…' : ''}</div>
        <div class="reader-meta">
          <span>by ${escapeHtml(p.author || 'Anonymous')}</span>
          <span>·</span><span>${timeAgo(p.created_at)}</span>
          ${p.book_title ? `<span>·</span><span>📖 ${escapeHtml(p.book_title)}</span>` : ''}
        </div>
      </div>
    </div>`).join('')
}

window.votePost = async (id, delta, btn) => {
  const el   = document.getElementById('votes-' + id)
  const newV = (parseInt(el.textContent) || 0) + delta
  await supabase.from('readers_posts').update({ votes: newV }).eq('id', id)
  el.textContent = newV
  el.style.color = delta > 0 ? '#3d7a50' : 'var(--rose)'
  setTimeout(() => el.style.color = 'var(--rose)', 700)
}

export async function submitReadersPost(data) {
  const { error } = await supabase.from('readers_posts').insert(data)
  if (error) { toast('❌ Could not submit. Try again.'); return false }
  toast('✅ Post submitted!')
  return true
}

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 60)   return m + 'm ago'
  if (m < 1440) return Math.floor(m / 60) + 'h ago'
  return Math.floor(m / 1440) + 'd ago'
}

// ── ABOUT PAGE ───────────────────────────────────────────
export async function loadAboutPage() {
  const nameEl = document.getElementById('about-name')
  if (!nameEl) return

  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) { console.error(error); return }
  if (!data) return

  const name   = data.author_name || data.site_name || 'halfsentence'
  const avatar = document.getElementById('about-avatar')
  if (avatar) avatar.textContent = (name[0] || 'h').toUpperCase()
  if (nameEl) nameEl.textContent = name

  const tagEl = document.getElementById('about-tagline')
  if (tagEl && data.author_bio) tagEl.textContent = data.author_bio

  const bodyEl = document.getElementById('about-body')
  if (bodyEl && data.about_html) bodyEl.innerHTML = data.about_html

  const linksEl = document.getElementById('about-links')
  if (linksEl) {
    const links = []
    if (data.author_email)    links.push(`<a class="about-link" href="mailto:${escapeAttr(data.author_email)}">✉ Email</a>`)
    if (data.link_twitter)    links.push(`<a class="about-link" href="${escapeAttr(data.link_twitter)}" target="_blank" rel="noopener">𝕏 Twitter</a>`)
    if (data.link_goodreads)  links.push(`<a class="about-link" href="${escapeAttr(data.link_goodreads)}" target="_blank" rel="noopener">📚 Goodreads</a>`)
    if (data.link_newsletter) links.push(`<a class="about-link" href="${escapeAttr(data.link_newsletter)}" target="_blank" rel="noopener">📰 Newsletter</a>`)
    linksEl.innerHTML = links.join('')
  }

  const footerName = document.getElementById('footer-site-name')
  if (footerName && data.site_name) footerName.textContent = data.site_name
}
