'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Post, UploadRecord, Category, CATEGORIES, CATEGORY_GRADIENT, CATEGORY_DESCRIPTION } from '@/lib/types';
import CategoryIcon from '@/components/CategoryIcon';
import { uploadPostImages, createSupabasePost } from '@/lib/db';
import { CURRENT_SEASON } from '@/lib/mockData';
import { getSeasonStatus } from '@/lib/season';
import CameraCapture from '@/components/CameraCapture';

const MAX_PHOTOS = 5;

export default function UploadPage() {
  const { addPost, state } = useStore();
  const router = useRouter();
  const galleryRef = useRef<HTMLInputElement>(null);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState(0);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [aiConfirmed, setAiConfirmed] = useState(false);

  const { currentUser, season, uploadHistory } = state;
  const primaryFilename = filenames[0] ?? '';

  const inTransition = getSeasonStatus().phase === 'transition';

  const DAILY_LIMIT = 10;
  const dailyUsed = useMemo(
    () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      return uploadHistory.filter(
        (r) => r.userId === currentUser.id && new Date(r.uploadedAt) >= start,
      ).length;
    },
    [uploadHistory, currentUser.id],
  );
  const dailyBlocked = dailyUsed >= DAILY_LIMIT;

  function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - imagePreviews.length;
    const toAdd = files.slice(0, remaining);
    setFilenames((prev) => [...prev, ...toAdd.map((f) => f.name)]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // reset so same file can be re-selected
    e.target.value = '';
  }

  function handleCameraCapture(dataUrl: string) {
    setImagePreviews((prev) => [...prev, dataUrl]);
    setFilenames((prev) => [...prev, `camera_${Date.now()}.jpg`]);
    setShowCamera(false);
  }

  function removePhoto(idx: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setFilenames((prev) => prev.filter((_, i) => i !== idx));
    setActivePreview((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  }

  const canSubmit = caption.trim() && category && !submitting && aiConfirmed && !dailyBlocked && !inTransition;

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const now = new Date().toISOString();

    // Upload images to Supabase Storage, fall back to base64 if upload fails
    const uploadedUrls = await uploadPostImages(currentUser.id, imagePreviews);
    const finalImages = uploadedUrls.length > 0 ? uploadedUrls : imagePreviews;

    // Write post to Supabase
    const supabaseId = await createSupabasePost({
      userId: currentUser.id,
      username: currentUser.username,
      caption: caption.trim(),
      category: category as Category,
      images: finalImages,
    });

    const postId = supabaseId ?? `p_${Date.now()}`;

    const post: Post = {
      id: postId,
      userId: currentUser.id,
      username: currentUser.username,
      caption: caption.trim(),
      imageUrl: finalImages[0] ?? '',
      images: finalImages.length > 1 ? finalImages : undefined,
      category: category as Category,
      likes: 0,
      comments: [],
      shares: 0,
      createdAt: now,
      status: 'active',
      season: season || CURRENT_SEASON,
      score: 0,
      views: 0,
      likedBy: [],
      uploadFilename: primaryFilename,
      previousScore: 0,
    };

    const record: UploadRecord = {
      postId,
      userId: currentUser.id,
      category: category as Category,
      season: season || CURRENT_SEASON,
      filename: primaryFilename,
      uploadedAt: now,
    };

    addPost(post, record);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => router.push('/'), 1200);
  }

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  if (success) {
    return (
      <div className="px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-white font-black text-2xl mb-2">Post Live!</h2>
        <p className="text-zinc-400 text-sm text-center">
          72-hour survival window has started.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-white font-black text-2xl mb-1">New Post</h1>
      <p className="text-zinc-500 text-sm mb-4">72-hour survival window starts on submit</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Photos
            </label>
            {imagePreviews.length > 0 && (
              <span className="text-xs text-zinc-600">{imagePreviews.length}/{MAX_PHOTOS}</span>
            )}
          </div>

          {imagePreviews.length > 0 ? (
            <div className="space-y-3">
              {/* Main preview */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950">
                <img
                  src={imagePreviews[activePreview]}
                  alt="Preview"
                  className="w-full h-auto block"
                  style={{ maxHeight: '480px', objectFit: 'contain' }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(activePreview)}
                  className="absolute top-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-1.5 rounded-xl border border-zinc-600"
                >
                  ✕ Remove
                </button>
                {imagePreviews.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {imagePreviews.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePreview(i)}
                        className={`rounded-full transition-all ${i === activePreview ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {imagePreviews.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imagePreviews.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActivePreview(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activePreview ? 'border-red-500' : 'border-zinc-700'}`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {imagePreviews.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => galleryRef.current?.click()}
                      className="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <span className="text-xl">+</span>
                    </button>
                  )}
                </div>
              )}

              {/* Add more (when only 1 photo) */}
              {imagePreviews.length === 1 && imagePreviews.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="w-full py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-300 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors"
                >
                  + Add more photos (up to {MAX_PHOTOS})
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex flex-col items-center justify-center gap-3 h-40 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-red-600/50 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 hover:text-white"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-semibold">Take Photo</span>
                <span className="text-xs text-zinc-600">In-app camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 h-40 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 hover:text-white"
              >
                <span className="text-3xl">🖼️</span>
                <span className="text-sm font-semibold">From Gallery</span>
                <span className="text-xs text-zinc-600">Up to {MAX_PHOTOS} photos</span>
              </button>
            </div>
          )}

          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryFiles}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const catSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    catSelected
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  <CategoryIcon category={cat} size={16} className="shrink-0" />
                  <div className="text-left">
                    <div>{cat}</div>
                    <div className="text-xs font-normal text-zinc-500 leading-tight mt-0.5">{CATEGORY_DESCRIPTION[cat]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What makes this post worth ranking?"
            maxLength={200}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
          />
          <div className="text-right text-xs text-zinc-600 mt-1">{caption.length}/200</div>
        </div>

        {/* Category gradient preview — only when no photos */}
        {category && imagePreviews.length === 0 && (
          <div
            className={`h-20 rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENT[category as Category]} flex items-center gap-3 px-5`}
          >
            <CategoryIcon category={category as Category} size={28} className="text-white/70" />
            <div>
              <div className="text-white font-bold text-sm">{category}</div>
              <div className="text-zinc-400 text-xs">Add a photo to stand out</div>
            </div>
          </div>
        )}

        {/* AI disclosure */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={aiConfirmed}
            onChange={(e) => setAiConfirmed(e.target.checked)}
            className="mt-0.5 accent-red-500 w-4 h-4 shrink-0"
          />
          <span className="text-zinc-400 text-xs leading-relaxed">
            I confirm this photo was taken by me and is <span className="text-white font-semibold">not AI-generated</span>. Submitting AI-generated content violates our{' '}
            <a href="/terms" className="text-red-400 underline">Terms of Service</a>.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-red-500 text-white font-black text-base py-4 rounded-2xl transition-colors disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : inTransition ? '⏳ Season Transitioning' : dailyBlocked ? '🚫 Daily Limit Reached' : 'Post. Rank. Survive. →'}
        </button>

        {dailyBlocked && (
          <p className="text-center text-xs text-zinc-600 -mt-2">
            You've posted {DAILY_LIMIT} times today. Resets at midnight.
          </p>
        )}
      </form>
    </div>
  );
}
