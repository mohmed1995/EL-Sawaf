/** تطبيع النص العربي للبحث: يحذف التشكيل ويوحّد الألف والياء والتاء المربوطة. */
export function normalizeArabic(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** يحوّل نص البحث إلى نمط LIKE آمن (يهرب % و _) بترتيب الكلمات. */
export function toLikePattern(query: string): string {
  const escaped = normalizeArabic(query).replace(/[\\%_]/g, (ch) => `\\${ch}`);
  return `%${escaped.split(' ').join('%')}%`;
}
