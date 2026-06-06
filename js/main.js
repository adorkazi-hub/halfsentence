// ═══════════════════════════════════════════════
//  halfsentence · main.js
//  Public site logic + Supabase data fetching
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
  return '<div class="spinner"></div><div class="loading-text">Loading…</div>'
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function avatarColor(name) {
  const colors = ['#6B9E7A','#7A8AAE','#C47A6B','#9B7CC0','#A07AB5','#8AAD82','#6BA3AE']
  let h = 0; for (let c of (name||'')) h = c.charCodeAt(0) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

// ── HOME PAGE ────────────────────────────────────────────
export async function loadHome() {
  const featuredWrap = document.getElementById('featured-wrap')
  const postsWrap    = document.getElementById('posts-wrap')
  if (!featuredWrap && !postsWrap) return

  if (featuredWrap) featuredWrap.innerHTML = spinner()
  if (postsWrap)    postsWrap.innerHTML    = spinner()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, excerpt, cover_url, category, tags, views, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) { console.error(error); return }
  if (!posts || posts.length === 0) {
    if (featuredWrap) featuredWrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✍️</div><div class="empty-state-text">No posts yet. Check back soon.</div></div>'
    if (postsWrap)    postsWrap.innerHTML    = ''
    return
  }

  // Fetch reaction counts
  const ids = posts.map(p => p.id)
  const { data: reactions } = await supabase
    .from('reactions')
    .select('post_id, type')
    .in('post_id', ids)

  const { data: comments } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', ids)
    .eq('status', 'approved')

  const likesMap    = {}, hatesMap = {}, commentsMap = {}
  ids.forEach(id => { likesMap[id] = 0; hatesMap[id] = 0; commentsMap[id] = 0 })
  reactions?.forEach(r => { if (r.type === 'like') likesMap[r.post_id]++; else hatesMap[r.post_id]++ })
  comments?.forEach(c => { commentsMap[c.post_id]++ })

  // Featured post
  const featured = posts[0]
  if (featuredWrap) {
    featuredWrap.innerHTML = `
      <div class="feat-main fade-up" onclick="window.location.href='post.html?id=${featured.id}'">
        ${featured.cover_url
          ? `<img class="feat-cover" src="${featured.cover_url}" alt="${featured.title}" loading="lazy"/>`
          : `<div class="feat-cover-placeholder">📖</div>`}
        <div class="feat-body">
          <span class="feat-badge">${featured.category || 'Essay'}</span>
          <div class="feat-title">${featured.title}</div>
          <div class="feat-excerpt">${featured.excerpt || ''}</div>
          <div class="feat-footer">
            <div class="react-chip" onclick="event.stopPropagation();handleReact('${featured.id}','like',this)">
              👍 <span>${likesMap[featured.id]}</span>
            </div>
            <div class="react-chip" onclick="event.stopPropagation();handleReact('${featured.id}','hate',this)">
              👎 <span>${hatesMap[featured.id]}</span>
            </div>
            <div class="react-chip">💬 ${commentsMap[featured.id]}</div>
            <span class="feat-read">${readTime(featured.excerpt)} · ${formatDate(featured.created_at)}</span>
          </div>
        </div>
      </div>
      <div class="feat-side">
        ${posts.slice(1, 4).map(p => `
          <div class="side-card" onclick="window.location.href='post.html?id=${p.id}'">
            <div class="side-card-img">
              ${p.cover_url ? `<img src="${p.cover_url}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover"/>` : '📝'}
            </div>
            <div class="side-card-body">
              <span class="side-card-cat">${p.category || ''}</span>
              <div class="side-card-title">${p.title}</div>
              <div class="side-card-meta">
                <span>👍 ${likesMap[p.id]}</span>
                <span>💬 ${commentsMap[p.id]}</span>
                <span>${readTime(p.excerpt)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>`
  }

  // Rest of posts grid
  if (postsWrap) {
    postsWrap.innerHTML = posts.slice(4).map(p => `
      <div class="post-card fade-up" onclick="window.location.href='post.html?id=${p.id}'">
        <div class="post-card-cover">
          ${p.cover_url ? `<img src="${p.cover_url}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover"/>` : '📝'}
        </div>
        <div class="post-card-body">
          <div class="post-card-top">
            <span class="post-card-cat">${p.category || ''}</span>
            <span class="post-card-date">${formatDate(p.created_at)}</span>
          </div>
          <div class="post-card-title">${p.title}</div>
          <div class="post-card-excerpt">${p.excerpt || ''}</div>
          <div class="post-card-footer">
            <span class="post-card-stat">👍 ${likesMap[p.id]}</span>
            <span class="post-card-stat">👎 ${hatesMap[p.id]}</span>
            <span class="post-card-stat">💬 ${commentsMap[p.id]}</span>
            <span class="post-card-time">${readTime(p.excerpt)}</span>
          </div>
        </div>
      </div>`).join('')
  }
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
    else query = query.eq('slug', slug)

    const { data: post, error } = await query.single()

    if (error || !post) {
      wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Post not found.</div></div>'
      return
    }

    const postId = post.id

    // Reactions
    const { data: reactions } = await supabase.from('reactions').select('type').eq('post_id', postId)
    const likes = reactions?.filter(r => r.type === 'like').length || 0
    const hates = reactions?.filter(r => r.type === 'hate').length || 0

    // Comments
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'approved')
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
     ${post.cover_url ? `<img class="post-cover" src="${escapeHtml(post.cover_url)}" alt="${escapeHtml(post.title)}" loading="lazy"/>` : ''}
${isFullHtml(post.body)
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
        <div id="comments-list">
          ${renderComments(comments || [])}
        </div>
      </div>
    </div>`

// Render full HTML post safely via blob URL
    if (isFullHtml(post.body)) {
      const wrap = document.getElementById('html-post-wrap')
      if (wrap) {
        const blob = new Blob([post.body], { type: 'text/html' })
        const url  = URL.createObjectURL(blob)
        const iframe = document.createElement('iframe')
        iframe.src = url
        iframe.style.cssText = 'width:100%;border:none;display:block'
        iframe.sandbox = 'allow-same-origin allow-scripts'
        iframe.scrolling = 'no'

        // Try to resize after load
        iframe.onload = function() {
          try {
            const h = this.contentDocument.documentElement.scrollHeight
              || this.contentDocument.body.scrollHeight
            this.style.height = (h + 50) + 'px'
          } catch(e) {
            // fallback — just make it very tall
            this.style.height = '5000px'
          }
          URL.revokeObjectURL(url)
        }

        // Safety fallback — if onload doesn't fire resize
        setTimeout(() => {
          if (iframe.style.height === '') iframe.style.height = '5000px'
        }, 3000)

        wrap.appendChild(iframe)
      }
    }
  
   // Tags
    if (post.tags?.length) {
      const tagsHtml = `<div style="margin-top:32px;display:flex;gap:8px;flex-wrap:wrap">
        ${post.tags.map(t => `<span class="hero-tag">${escapeHtml(t)}</span>`).join('')}
      </div>`
      const tagsTarget = wrap.querySelector('.post-body') || wrap.querySelector('.post-html-wrap')
      if (tagsTarget) tagsTarget.insertAdjacentHTML('afterend', tagsHtml)
    }

    // Bump view count in background (must not block page render)
    supabase.rpc('increment_views', { post_id: postId }).then(() => {}).catch(() => {})
  } catch (err) {
    console.error('loadPost error:', err)
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">Could not load this post. Please try again.</div></div>'
  }
}

function renderComments(comments) {
  if (!comments.length) return '<div class="empty-state" style="padding:30px 0"><div class="empty-state-text">No comments yet. Be the first!</div></div>'
  return comments.map(c => `
    <div class="comment-item" id="comment-${c.id}">
      <div class="comment-head">
        <div class="comment-avatar" style="background:${avatarColor(c.author)}">${(c.author || '?')[0].toUpperCase()}</div>
        <div>
          <div class="comment-name">${c.author || 'Anonymous'}</div>
          <div class="comment-date">${formatDate(c.created_at)}</div>
        </div>
      </div>
      <div class="comment-text">${c.body}</div>
    </div>`).join('')
}

// ── REACTIONS ────────────────────────────────────────────
let userReacted = null

export async function reactToPost(postId, type) {
  if (userReacted === type) {
    // Remove reaction
    await supabase.from('reactions').delete()
      .eq('post_id', postId).eq('type', type).eq('session_id', getSession())
    userReacted = null
  } else {
    // Remove opposite if exists
    if (userReacted) {
      await supabase.from('reactions').delete()
        .eq('post_id', postId).eq('session_id', getSession())
    }
    await supabase.from('reactions').insert({ post_id: postId, type, session_id: getSession() })
    userReacted = type
  }

  // Refresh counts
  const { data: reactions } = await supabase.from('reactions').select('type').eq('post_id', postId)
  const likes = reactions?.filter(r => r.type === 'like').length || 0
  const hates = reactions?.filter(r => r.type === 'hate').length || 0
  document.getElementById('like-count').textContent = likes
  document.getElementById('hate-count').textContent = hates
  document.getElementById('like-btn').classList.toggle('liked', userReacted === 'like')
  document.getElementById('hate-btn').classList.toggle('hated', userReacted === 'hate')
  toast(type === 'like' ? '👍 Thanks!' : '👎 Noted!')
}

// Handle react on card (home page)
window.handleReact = async (postId, type, el) => {
  const span = el.querySelector('span')
  await supabase.from('reactions').insert({ post_id: postId, type, session_id: getSession() })
  span.textContent = parseInt(span.textContent) + 1
  el.style.borderColor = type === 'like' ? '#7dbf8e' : '#c0886e'
  toast(type === 'like' ? '👍 Liked!' : '👎 Noted!')
}

function getSession() {
  let s = localStorage.getItem('hs_session')
  if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem('hs_session', s) }
  return s
}

// ── COMMENTS ────────────────────────────────────────────
export async function submitComment(postId) {
  const name  = document.getElementById('comment-name')?.value.trim()
  const body  = document.getElementById('comment-body')?.value.trim()
  const btn   = document.getElementById('comment-submit')
  if (!name || !body) { toast('⚠️ Enter your name and comment'); return }

  btn.disabled = true; btn.textContent = 'Posting…'

  const { error } = await supabase.from('comments').insert({
    post_id: postId, author: name, body, status: 'pending'
  })

  btn.disabled = false; btn.textContent = 'Post comment'

  if (error) { toast('❌ Something went wrong. Try again.'); console.error(error); return }

  document.getElementById('comment-name').value = ''
  document.getElementById('comment-body').value = ''
  toast('✅ Comment submitted! It will appear after review.')
}

// Make functions global so onclick works
window.reactToPost   = reactToPost
window.submitComment = submitComment

// ── READERS CORNER ───────────────────────────────────────
export async function loadReadersCorner() {
  const feed = document.getElementById('readers-feed')
  if (!feed) return
  feed.innerHTML = spinner()

  const { data: posts, error } = await supabase
    .from('readers_posts')
    .select('*')
    .order('votes', { ascending: false })

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
        <div class="reader-title">${p.title}</div>
        <div class="reader-preview">${(p.body || '').substring(0, 180)}${p.body?.length > 180 ? '…' : ''}</div>
        <div class="reader-meta">
          <span>by ${p.author || 'Anonymous'}</span>
          <span>·</span>
          <span>${timeAgo(p.created_at)}</span>
          ${p.book_title ? `<span>·</span><span>📖 ${p.book_title}</span>` : ''}
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
  setTimeout(() => el.style.color = 'var(--sage)', 700)
}

export async function submitReadersPost(data) {
  const { error } = await supabase.from('readers_posts').insert(data)
  if (error) { toast('❌ Could not submit. Try again.'); console.error(error); return false }
  toast('✅ Post submitted!')
  return true
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)   return m + 'm ago'
  if (m < 1440) return Math.floor(m / 60) + 'h ago'
  return Math.floor(m / 1440) + 'd ago'
}

// ── ABOUT PAGE (from site_settings) ──────────────────────
export async function loadAboutPage() {
  const nameEl = document.getElementById('about-name')
  if (!nameEl) return

  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) {
    console.error(error)
    const body = document.getElementById('about-body')
    if (body) body.innerHTML = '<p>Could not load About page. Run supabase-patch.sql in your Supabase project.</p>'
    return
  }
  if (!data) return

  const name = data.author_name || data.site_name || 'halfsentence'
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
    if (data.author_email)
      links.push(`<a class="about-link" href="mailto:${escapeAttr(data.author_email)}">✉ Email</a>`)
    if (data.link_twitter)
      links.push(`<a class="about-link" href="${escapeAttr(data.link_twitter)}" target="_blank" rel="noopener">𝕏 Twitter</a>`)
    if (data.link_goodreads)
      links.push(`<a class="about-link" href="${escapeAttr(data.link_goodreads)}" target="_blank" rel="noopener">📚 Goodreads</a>`)
    if (data.link_newsletter)
      links.push(`<a class="about-link" href="${escapeAttr(data.link_newsletter)}" target="_blank" rel="noopener">📰 Newsletter</a>`)
    linksEl.innerHTML = links.join('')
  }

  const footerName = document.getElementById('footer-site-name')
  if (footerName && data.site_name) footerName.textContent = data.site_name
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

// Detect if post body is a full HTML document
function isFullHtml(body) {
  if (!body) return false
  const trimmed = body.trim().toLowerCase()
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')
}