export function createDropboxUrls(sharedUrl) {
  if (!sharedUrl) return null;
  try {
    const url = new URL(sharedUrl);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('dropbox.com')) return null;
    url.searchParams.delete('dl');
    url.searchParams.delete('raw');
    const stream = new URL(url);
    const download = new URL(url);
    stream.searchParams.set('raw', '1');
    download.searchParams.set('dl', '1');
    return { share: url.toString(), stream: stream.toString(), download: download.toString() };
  } catch { return null; }
}

export function renderVideoCard(video) {
  const urls = createDropboxUrls(video.shareUrl);
  const poster = video.posterPath ? ` poster="${video.posterPath}"` : '';
  if (!urls) return `<section class="video-card"><div class="video-stage" aria-hidden="true">${video.posterPath ? `<img src="${video.posterPath}" alt="">` : ''}<span class="play-disc">▶</span></div><div class="video-copy"><span class="eyebrow">Training film</span><h2>${video.title}</h2><p>${video.description}</p><p class="status-chip">● Video coming soon</p><a class="text-link" href="#verb-roster">Skip to the verb roster ↓</a></div></section>`;
  return `<section class="video-card"><video controls preload="metadata" playsinline${poster}><source src="${urls.stream}" type="video/mp4"></video><div class="video-copy"><span class="eyebrow">Training film</span><h2>${video.title}</h2><p>${video.description}</p><div class="button-row"><a class="button button-secondary" href="${urls.share}" target="_blank" rel="noopener">Open in Dropbox</a><a class="text-link" href="${urls.download}">Download</a></div><p class="video-error" hidden>We couldn’t play the video here. Open it in Dropbox or continue to training.</p></div></section>`;
}

export function activateVideoFallback(container) {
  const video = container.querySelector('video');
  if (video) video.addEventListener('error', () => { container.querySelector('.video-error').hidden = false; }, { once: true });
}
