import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import PostCard from '../components/PostCard.jsx'
import ProfileSearch from '../components/ProfileSearch.jsx'

export default function Feed() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setError('')
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, content, is_anonymous, created_at, profiles ( username, avatar_url )')
      .order('created_at', { ascending: false })
      .limit(100)

    if (postsError) {
      setError(postsError.message)
      setPosts([])
      return
    }

    const postIds = postsData.map((p) => p.id)
    let candleRows = []
    let commentRows = []
    if (postIds.length > 0) {
      const [{ data: candleData }, { data: commentData }] = await Promise.all([
        supabase.from('candles').select('post_id, user_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds)
      ])
      candleRows = candleData || []
      commentRows = commentData || []
    }

    const enriched = postsData.map((p) => {
      const lit = candleRows.filter((c) => c.post_id === p.id)
      const comments = commentRows.filter((c) => c.post_id === p.id)
      return {
        ...p,
        author_username: p.profiles?.username,
        author_avatar_url: p.profiles?.avatar_url,
        candle_count: lit.length,
        lit_by_me: lit.some((c) => c.user_id === user?.id),
        comment_count: comments.length
      }
    })

    setPosts(enriched)
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="mb-6">
        <ProfileSearch />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-display">{t('feed.title')}</h1>
        <p className="text-parchment-dim text-sm mt-1">{t('feed.subtitle')}</p>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {posts === null && (
        <div className="flex justify-center py-20">
          <span className="wick text-candle text-2xl animate-flicker">🕯️</span>
        </div>
      )}

      {posts && posts.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-parchment-muted">{t('feed.empty')}</p>
          <Link to="/new" className="btn-primary inline-flex mt-4">
            {t('feed.emptyCta')}
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} onChanged={loadPosts} />
        ))}
      </div>
    </div>
  )
}