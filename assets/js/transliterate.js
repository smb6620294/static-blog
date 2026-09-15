/* ============================================
   TRANSLITERATE.JS - Multi-Language to Latin Slug Converter
   Converts Russian, Urdu, Arabic, Ukrainian, etc. to Latin
   Used by: utils.js (for slug generation), tags, categories, posts
   ============================================ */

// ==================== RUSSIAN → LATIN ====================
const TRANSLIT_RUSSIAN = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Capital letters
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
  'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
  'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
  'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
  'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
  'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
  'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

// ==================== UKRAINIAN → LATIN ====================
const TRANSLIT_UKRAINIAN = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g',
  'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
  'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k',
  'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
  'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
  'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ь': '', 'ю': 'yu', 'я': 'ya',
  // Capital
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G',
  'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z',
  'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K',
  'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
  'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
  'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ь': '', 'Ю': 'Yu', 'Я': 'Ya'
};

// ==================== URDU → LATIN ====================
const TRANSLIT_URDU = {
  'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't',
  'ٹ': 'tt', 'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h',
  'خ': 'kh', 'د': 'd', 'ڈ': 'dd', 'ذ': 'z', 'ر': 'r',
  'ڑ': 'rr', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ک': 'k', 'گ': 'g',
  'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'w',
  'ہ': 'h', 'ھ': 'h', 'ء': '', 'ی': 'y', 'ے': 'e',
  'ۓ': 'ye', 'ؤ': 'o', 'ئ': 'y',
  // Digits (Urdu)
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

// ==================== ARABIC → LATIN ====================
const TRANSLIT_ARABIC = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b',
  'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's',
  'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k',
  'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
  'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'y',
  'ؤ': 'w', 'لا': 'la',
  // Digits
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

// ==================== PERSIAN (Farsi) → LATIN ====================
const TRANSLIT_PERSIAN = {
  'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't',
  'ث': 's', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't',
  'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh',
  'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'و': 'v', 'ه': 'h', 'ی': 'y', 'ء': '',
  // Digits
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

// ==================== HINDI (Devanagari) → LATIN ====================
const TRANSLIT_HINDI = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u',
  'ऊ': 'oo', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o',
  'औ': 'au', 'अं': 'an', 'अः': 'ah',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'क्ष': 'ksh', 'त्र': 'tr',
  'ज्ञ': 'gy',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n',
  'ँ': 'n', 'ः': 'h', '्': '',
  // Digits
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

// ==================== GREEK → LATIN ====================
const TRANSLIT_GREEK = {
  'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e',
  'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k',
  'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o',
  'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't',
  'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
  // Capital
  'Α': 'A', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E',
  'Ζ': 'Z', 'Η': 'I', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K',
  'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O',
  'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y',
  'Φ': 'F', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'O'
};

// ==================== HEBREW → LATIN ====================
const TRANSLIT_HEBREW = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
  'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
  'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm',
  'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p',
  'ף': 'p', 'צ': 'ts', 'ץ': 'ts', 'ק': 'q', 'ר': 'r',
  'ש': 'sh', 'ת': 't'
};

// ==================== COMBINED MAP ====================
const TRANSLIT_MAP = Object.assign(
  {},
  TRANSLIT_RUSSIAN,
  TRANSLIT_UKRAINIAN,
  TRANSLIT_URDU,
  TRANSLIT_ARABIC,
  TRANSLIT_PERSIAN,
  TRANSLIT_HINDI,
  TRANSLIT_GREEK,
  TRANSLIT_HEBREW
);

// ==================== TRANSLITERATE FUNCTION ====================
/**
 * Convert non-Latin text to Latin characters
 * @param {string} text - Input text (any language)
 * @returns {string} - Latin-only text
 */
function transliterate(text) {
  if (!text) return '';
  
  let result = '';
  let str = String(text);
  
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    
    if (TRANSLIT_MAP[char] !== undefined) {
      result += TRANSLIT_MAP[char];
    } else {
      result += char;
    }
  }
  
  return result;
}

// ==================== DETECT SCRIPT ====================
/**
 * Detect which language/script the text is in
 * @param {string} text 
 * @returns {string} - 'russian', 'urdu', 'arabic', 'hindi', 'latin', etc.
 */
function detectScript(text) {
  if (!text) return 'latin';
  
  let str = String(text);
  
  if (/[\u0400-\u04FF]/.test(str)) return 'russian';
  if (/[\u0600-\u06FF]/.test(str)) {
    if (/[پچژگ]/.test(str)) return 'persian';
    if (/[\u0679\u0688\u0691\u06BA\u06BE\u06C1\u06CC]/.test(str)) return 'urdu';
    return 'arabic';
  }
  if (/[\u0900-\u097F]/.test(str)) return 'hindi';
  if (/[\u0370-\u03FF]/.test(str)) return 'greek';
  if (/[\u0590-\u05FF]/.test(str)) return 'hebrew';
  
  return 'latin';
}

// ==================== SMART SLUGIFY ====================
/**
 * Convert any text (any language) to URL-friendly slug
 * @param {string} text - Input text
 * @param {object} options - { maxLength: 80, separator: '-' }
 * @returns {string} - URL slug
 */
function smartSlugify(text, options = {}) {
  if (!text) return '';
  
  let maxLength = options.maxLength || 100;
  let separator = options.separator || '-';
  
  // Step 1: Transliterate to Latin
  let latin = transliterate(String(text));
  
  // Step 2: Lowercase
  let slug = latin.toLowerCase();
  
  // Step 3: Remove everything except letters, numbers, spaces, hyphens
  slug = slug.replace(/[^a-z0-9\s\-]/g, '');
  
  // Step 4: Replace spaces with separator
  slug = slug.replace(/\s+/g, separator);
  
  // Step 5: Replace multiple separators with single
  let sepRegex = new RegExp('\\' + separator + '+', 'g');
  slug = slug.replace(sepRegex, separator);
  
  // Step 6: Trim separators from start/end
  slug = slug.replace(new RegExp('^\\' + separator + '|\\' + separator + '$', 'g'), '');
  
  // Step 7: Limit length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing separator if any
    slug = slug.replace(new RegExp('\\' + separator + '$'), '');
  }
  
  return slug;
}

// ==================== EXPORT FOR NODE (optional) ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    transliterate,
    detectScript,
    smartSlugify
  };
}

// ==================== LOG ON LOAD ====================
console.log('✅ transliterate.js loaded — supports Russian, Ukrainian, Urdu, Arabic, Persian, Hindi, Greek, Hebrew');
