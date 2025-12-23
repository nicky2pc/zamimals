const cache = new Map<string, HTMLImageElement>();

export const getCachedImage = (src: string): Promise<HTMLImageElement> => {
  const existing = cache.get(src);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
  });
};

export const getImageFromCache = (src: string): HTMLImageElement | undefined => cache.get(src);

export const preloadImages = async (srcList: string[]): Promise<void> => {
  await Promise.all(srcList.map((s) => getCachedImage(s).catch(() => undefined)));
};



