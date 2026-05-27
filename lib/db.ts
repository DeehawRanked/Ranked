import { supabase } from './supabase';
import { Post, Comment, Category, SocialLinks, BoostTier, BOOST_TIERS } from './types';

const CAT_PAGE_SIZE = 30;

export interface SupabaseProfile {
  id: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  socialLinks: SocialLinks;
  followersCount: number;
  followingCount: number;
}

export async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url, social_links, followers_count, following_count')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    bio: data.bio ?? '',
    avatarUrl: data.avatar_url ?? undefined,
    socialLinks: (data.social_links as SocialLinks) ?? {},
    followersCount: data.followers_count ?? 0,
    followingCount: data.following_count ?? 0,
  };
}

export async function updateProfileData(userId: string, bio: string, socialLinks: SocialLinks): Promise<void> {
  await supabase
    .from('profiles')
    .update({ bio, social_links: socialLinks })
    .eq('id', userId);
}

export async function uploadAvatarImage(userId: string, dataUrl: string): Promise<string | null> {
  const blob = dataURLtoBlob(dataUrl);
  const ext = blob.type.split('/')[1] || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, blob, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)![1];
  const bstr = atob(data);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

export async function uploadPostImages(userId: string, images: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img.startsWith('data:')) { urls.push(img); continue; }
    const blob = dataURLtoBlob(img);
    const ext = blob.type.split('/')[1] || 'jpg';
    const path = `${userId}/${Date.now()}_${i}.${ext}`;
    const { error } = await supabase.storage.from('post-images').upload(path, blob);
    if (!error) {
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }
  return urls;
}

function mapRow(row: any): Post {
  const images: string[] = row.images ?? [];
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    caption: row.caption,
    category: row.category as Category,
    imageUrl: images[0] ?? '',
    images: images.length > 1 ? images : undefined,
    likes: row.likes_count ?? 0,
    likedBy: (row.likes ?? []).map((l: any) => l.user_id as string),
    comments: (row.comments ?? [])
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((c: any): Comment => ({
        id: c.id,
        userId: c.user_id,
        username: c.username,
        text: c.text,
        parentId: c.parent_id ?? undefined,
        createdAt: c.created_at,
      })),
    reports: [],
    shares: row.shares_count ?? 0,
    views: row.views_count ?? 0,
    score: row.score ?? 0,
    status: row.status,
    currentRank: row.current_rank ?? undefined,
    peakRank: row.peak_rank ?? undefined,
    previousRank: row.previous_rank ?? undefined,
    createdAt: row.created_at,
    season: (row.created_at as string).slice(0, 7),
    uploadFilename: '',
    previousScore: 0,
    boost: row.boost_tier ? {
      tier: row.boost_tier as BoostTier,
      impressionsTotal: row.boost_impressions_total ?? 0,
      impressionsRemaining: row.boost_impressions_remaining ?? 0,
      purchasedAt: row.boost_purchased_at ?? '',
    } : undefined,
  };
}

const PAGE_SIZE = 50;

export async function fetchSupabasePosts(page = 0): Promise<{ posts: Post[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('posts')
    .select(`*, likes(user_id), comments(id, user_id, username, text, parent_id, created_at)`)
    .eq('status', 'active')
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) return { posts: [], hasMore: false };
  return { posts: data.map(mapRow), hasMore: data.length === PAGE_SIZE };
}

export async function createSupabasePost(params: {
  userId: string;
  username: string;
  caption: string;
  category: Category;
  images: string[];
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: params.userId,
      username: params.username,
      caption: params.caption,
      category: params.category,
      images: params.images,
    })
    .select('id')
    .single();

  if (error || !data) { console.error('createSupabasePost:', error); return null; }
  return data.id as string;
}

export async function likeSupabasePost(postId: string, userId: string, isCurrentlyLiked: boolean): Promise<void> {
  if (isCurrentlyLiked) {
    await supabase.from('likes').delete().match({ post_id: postId, user_id: userId });
    await supabase.rpc('decrement_post_likes', { post_id: postId });
  } else {
    await supabase.from('likes').upsert({ post_id: postId, user_id: userId });
    await supabase.rpc('increment_post_likes', { post_id: postId });
  }
}

export async function addSupabaseComment(params: {
  postId: string;
  userId: string;
  username: string;
  text: string;
  parentId?: string;
}): Promise<void> {
  await supabase.from('comments').insert({
    post_id: params.postId,
    user_id: params.userId,
    username: params.username,
    text: params.text,
    parent_id: params.parentId ?? null,
  });
}

export async function reportSupabasePost(postId: string, userId: string, reason: string): Promise<void> {
  await supabase.from('reports').upsert({ post_id: postId, user_id: userId, reason });
}

export async function recordSupabaseView(postId: string): Promise<void> {
  await supabase.rpc('increment_post_views', { post_id: postId });
}

export async function shareSupabasePost(postId: string): Promise<void> {
  await supabase.rpc('increment_post_shares', { post_id: postId });
}

export async function deleteSupabasePost(postId: string): Promise<void> {
  await supabase.from('posts').delete().eq('id', postId);
}

export async function updateSupabaseCaption(postId: string, caption: string): Promise<void> {
  await supabase.from('posts').update({ caption }).eq('id', postId);
}

export async function saveSupabaseBoost(postId: string, tier: BoostTier): Promise<void> {
  const cfg = BOOST_TIERS[tier];
  await supabase.from('posts').update({
    boost_tier: tier,
    boost_impressions_total: cfg.impressions,
    boost_impressions_remaining: cfg.impressions,
    boost_purchased_at: new Date().toISOString(),
  }).eq('id', postId);
}

export async function decrementSupabaseBoostImpression(postId: string): Promise<void> {
  await supabase.rpc('decrement_boost_impression', { post_id: postId });
}

export async function fetchPostsByCategory(
  category: Category,
  page = 0,
  orderBy: 'likes' | 'recent' = 'likes',
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const from = page * CAT_PAGE_SIZE;
  const to = from + CAT_PAGE_SIZE - 1;

  let query = supabase
    .from('posts')
    .select(`*, likes(user_id), comments(id, user_id, username, text, parent_id, created_at)`)
    .eq('status', 'active')
    .eq('category', category)
    .range(from, to);

  query = orderBy === 'likes'
    ? query.order('likes_count', { ascending: false }).order('created_at', { ascending: false })
    : query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error || !data) return { posts: [], hasMore: false };
  return { posts: data.map(mapRow), hasMore: data.length === CAT_PAGE_SIZE };
}

export async function fetchRecentPosts(): Promise<Post[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('posts')
    .select(`*, likes(user_id), comments(id, user_id, username, text, parent_id, created_at)`)
    .eq('status', 'active')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map(mapRow);
}

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  return (data ?? []).map((r: any) => r.following_id as string);
}

export async function followSupabaseUser(followerId: string, followingId: string): Promise<void> {
  await supabase.from('follows').upsert({ follower_id: followerId, following_id: followingId });
  await supabase.rpc('increment_follow_counts', { follower: followerId, following: followingId });
}

export async function unfollowSupabaseUser(followerId: string, followingId: string): Promise<void> {
  await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
  await supabase.rpc('decrement_follow_counts', { follower: followerId, following: followingId });
}
