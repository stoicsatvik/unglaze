(() => {
  const glazeTerms = [
    "thrilled to announce",
    "excited to announce",
    "excited to share",
    "delighted to share",
    "delighted to announce",
    "honoured to",
    "honored to",
    "incredible journey",
    "transformative journey",
    "game-changing",
    "revolutionary",
    "disruptive",
    "amazing team",
    "grateful to",
    "humbled to",
    "proud to announce",
    "passionate about",
    "changing the world",
    "unlocking the power of"
  ];

  const opinionPatterns = [
    /\bi think\b/i,
    /\bi believe\b/i,
    /\bi feel\b/i,
    /\bin my opinion\b/i,
    /\bbest\b/i,
    /\bamazing\b/i,
    /\bincredible\b/i,
    /\bterrible\b/i,
    /\bbeautiful\b/i
  ];

  const predictionPatterns = [
    /\bwill\b/i,
    /\bgoing to\b/i,
    /\bexpect(?:ed|s)?\b/i,
    /\bforecast\b/i,
    /\bmay\b/i,
    /\bmight\b/i,
    /\bcould\b/i
  ];

  const monthPattern = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
  const numberDetector = /(?:[$₹€£]\s?)?\d[\d,.]*(?:\s?(?:%|k|m|b|million|billion|crore|lakh|users?|customers?|employees?|months?|years?|days?|hours?))?/i;
  const numberExtractor = /(?:[$₹€£]\s?)?\d[\d,.]*(?:\s?(?:%|k|m|b|million|billion|crore|lakh|users?|customers?|employees?|months?|years?|days?|hours?))?/gi;

  const normalizeWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();

  const splitSentences = (text) => {
    const normalized = normalizeWhitespace(text);
    if (!normalized) return [];
    const parts = normalized.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [normalized];
    return parts.map(normalizeWhitespace).filter((part) => part.length > 2);
  };

  const findGlaze = (text) => {
    const lower = text.toLowerCase();
    return glazeTerms.filter((term) => lower.includes(term));
  };

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const stripGlaze = (sentence) => {
    let result = normalizeWhitespace(sentence);
    for (const term of glazeTerms) {
      result = result.replace(new RegExp(`\\b${escapeRegExp(term)}\\b[:,;!]?\\s*`, "ig"), "");
    }
    result = result
      .replace(/^(after|following)\s+(months?|years?)\s+of\s+[^,]+,\s*/i, "")
      .replace(/^i(?:'m| am)\s+/i, "")
      .replace(/^that\s+/i, "")
      .trim();
    return result || sentence;
  };

  const isOpinion = (sentence) => opinionPatterns.some((pattern) => pattern.test(sentence));
  const isPrediction = (sentence) => predictionPatterns.some((pattern) => pattern.test(sentence));

  const looksFactual = (sentence) => {
    if (isOpinion(sentence)) return false;
    return (
      numberDetector.test(sentence) ||
      monthPattern.test(sentence) ||
      /\b(?:launched|raised|acquired|released|joined|founded|built|hired|opened|closed|grew|reached|shipped|published|won|lost|signed|sold|generated|revenue|users?|customers?|funding|employees?)\b/i.test(sentence)
    );
  };

  const unique = (items) => [...new Set(items.filter(Boolean))];

  const hasPercentageBaseline = (text) =>
    /baseline|previous|prior/i.test(text) ||
    /\bfrom\b\s+[^.!?]{0,40}\bto\b/i.test(text) ||
    /\b(?:from|to)\s+[$₹€£]?\s*\d/i.test(text);

  const inferMissingContext = (text) => {
    const missing = [];
    if (/\b\d+(?:\.\d+)?%/.test(text) && !hasPercentageBaseline(text)) {
      missing.push("Percentage change is given without a clear baseline.");
    }
    if (/\b(?:users?|customers?)\b/i.test(text) && !/active|paying|registered|monthly|daily|retained/i.test(text)) {
      missing.push("User/customer metric is not clearly defined.");
    }
    if (/\brevenue\b/i.test(text) && !/[$₹€£]|crore|lakh|million|billion|\bk\b|\bm\b/i.test(text)) {
      missing.push("Revenue is mentioned without an absolute amount.");
    }
    if (/\b(?:raised|funding|round)\b/i.test(text) && !/seed|series|pre-seed|debt|grant|valuation|lead investor/i.test(text)) {
      missing.push("Funding claim omits round structure or investor context.");
    }
    if (/\b(?:grew|growth|increase|increased|up)\b/i.test(text) && !/\b(?:month|quarter|year|week|day|yoy|mom|qoq)\b/i.test(text)) {
      missing.push("Growth claim does not specify a time window.");
    }
    return unique(missing);
  };

  const buildSummary = (sentences) => {
    const scored = sentences
      .map((sentence, index) => {
        const cleaned = stripGlaze(sentence);
        let score = 0;
        if (looksFactual(cleaned)) score += 4;
        if (numberDetector.test(cleaned)) score += 3;
        if (/https?:\/\//i.test(cleaned)) score += 1;
        if (isOpinion(cleaned)) score -= 2;
        if (isPrediction(cleaned)) score -= 1;
        score -= index * 0.05;
        return { sentence: cleaned, score };
      })
      .filter((item) => item.sentence.length > 4)
      .sort((a, b) => b.score - a.score);

    return unique(scored.slice(0, 3).map((item) => item.sentence)).join(" ").slice(0, 700);
  };

  const analyze = ({ text = "", links = [] } = {}) => {
    const normalized = normalizeWhitespace(text);
    const sentences = splitSentences(normalized);
    const promotionalLanguage = findGlaze(normalized);
    const opinions = sentences.filter(isOpinion);
    const predictions = sentences.filter(isPrediction);
    const factualClaims = sentences.filter(looksFactual);
    const claims = sentences
      .filter((sentence) => !opinions.includes(sentence))
      .map((sentence) => ({
        text: stripGlaze(sentence),
        status: "self_reported",
        confidence: looksFactual(sentence) ? 0.72 : 0.55
      }))
      .filter((claim) => claim.text.length > 3)
      .slice(0, 12);

    const numbers = unique(normalized.match(numberExtractor) || []).slice(0, 20);
    const evidenceLinks = unique(
      links
        .map((link) => (typeof link === "string" ? link : link?.href))
        .filter((href) => /^https?:\/\//i.test(href || ""))
    ).slice(0, 10);

    const summary = buildSummary(sentences);
    const originalLength = normalized.length || 1;

    return {
      summary: summary || normalized.slice(0, 700),
      claims,
      factualClaims: factualClaims.map(stripGlaze).slice(0, 12),
      numbers,
      evidenceLinks,
      opinions: opinions.slice(0, 8),
      predictions: predictions.slice(0, 8),
      promotionalLanguage,
      missingContext: inferMissingContext(normalized),
      compressionRatio: Number(((summary.length || normalized.length) / originalLength).toFixed(2)),
      sourceLength: normalized.length
    };
  };

  globalThis.UnglazeCore = {
    analyze,
    normalizeWhitespace,
    splitSentences,
    stripGlaze,
    inferMissingContext
  };
})();
