import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import MediaUploader from '../components/MediaUploader.jsx'
import MediaPostCard from '../components/MediaPostCard.jsx'
import { getBlockedIds } from '../lib/blocks'

export default function Discover() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPosts()
  }, [profile?.preferred_gender])

  async function loadPosts() {
    setError('')

    const { data: postsData, error: postsError } = await supabase
      .from('media_posts')
      .select('id, user_id, media_path, media_type, caption, created_at, profiles ( username, avatar_url, gender )')
      .order('created_at', { ascending: false })
      .limit(100)

    if (postsError) {
      setError(postsError.message)
      setPosts([])
      return
    }

    const blockedIds = user ? await getBlockedIds(user.id) : []

    // Gender-based visibility: only show posts from authors matching the
    // viewer's stated preference. "all" (or no preference set) shows everyone.
    const preference = profile?.preferred_gender
    const visible = postsData.filter((p) => {
      if (blockedIds.includes(p.user_id)) return false
      if (!preference || preference === 'all') return true
      return p.profiles?.gender === preference
    })

    const postIds = visible.map((p) => p.id)
    let candleRows = []
    let commentRows = []
    if (postIds.length > 0) {
      const [{ data: candles }, { data: comments }] = await Promise.all([
        supabase.from('media_candles').select('media_post_id, user_id').in('media_post_id', postIds),
        supabase.from('media_comments').select('media_post_id').in('media_post_id', postIds)
      ])
      candleRows = candles || []
      commentRows = comments || []
    }

    const enriched = visible.map((p) => {
      const lit = candleRows.filter((c) => c.media_post_id === p.id)
      const commentCount = commentRows.filter((c) => c.media_post_id === p.id).length
      const { data: publicUrlData } = supabase.storage.from('discover-media').getPublicUrl(p.media_path)
      return {
        ...p,
        media_url: publicUrlData.publicUrl,
        author_username: p.profiles?.username,
        author_avatar_url: p.profiles?.avatar_url,
        candle_count: lit.length,
        lit_by_me: lit.some((c) => c.user_id === user?.id),
        comment_count: commentCount
      }
    })

    setPosts(enriched)
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-display">{t('Discover')}</h1>
        <p className="text-parchment-dim text-sm mt-1">{t('subtitle')}</p>
      </div>

      <div className="mb-6">
        <MediaUploader onPosted={loadPosts} />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {posts === null && (
        <div className="flex justify-center py-20">
          <span className="wick text-candle text-2xl animate-flicker">🕯️</span>
        </div>
      )}

      {posts && posts.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-parchment-muted">{t('discover.empty')}</p>
        </div>
      )}

      <div className="space-y-5">
        {posts?.map((post) => (
          <MediaPostCard key={post.id} post={post} onChanged={loadPosts} />
        ))}
      </div>
    </div>
  )
}