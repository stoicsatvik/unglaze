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
    const parts = normalized.split(/(?<=[.!?])\s+(?=\S)/);
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
  const isPrediction = (sentence) => {
    // Calendar May is not the modal "may"; preserve any second, genuinely modal "may".
    let withoutCalendarMay = sentence
      .replace(/\bmay\s+(?:\d{1,2}(?:,\s*)?)?\d{4}\b|\b\d{1,2}\s+may\s+\d{4}\b/gi, "")
      .replace(/\b(?:in|during|since|throughout|through|by|for|on)\s+may(?:\s+\d{1,2}(?:st|nd|rd|th)?)?\b/gi, "")
      .replace(/\bmay\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi, "");
    // A capitalized month modifying a metric in a past-tense report is not a forecast.
    // Require past-tense evidence so "May sales rise?" remains a modal question.
    if (/\b(?:rose|grew|fell|declined|reached|shipped|joined|generated|increased|decreased|reported|hit|was|were)\b/i.test(sentence)) {
      withoutCalendarMay = withoutCalendarMay.replace(
        /\bMay(?=\s+(?:revenue|sales|users?|customers?|funding|orders?|shipments?|profits?|income|costs?|earnings|registrations?|metrics?|results?|figures?|data)\b)/g,
        ""
      );
    }
    return predictionPatterns.some((pattern) => pattern.test(withoutCalendarMay));
  };

  const looksFactual = (sentence) => {
    if (isOpinion(sentence) || isPrediction(sentence)) return false;
    return (
      numberDetector.test(sentence) ||
      monthPattern.test(sentence) ||
      /\b(?:launched|raised|acquired|released|joined|founded|built|hired|opened|closed|grew|reached|shipped|published|won|lost|signed|sold|generated|revenue|users?|customers?|funding|employees?)\b/i.test(sentence)
    );
  };

  const unique = (items) => [...new Set(items.filter(Boolean))];

  // E253: a textual "from/to" is not automatically evidence for a
  // percentage. Require an explicit numeric pair, compatible units, and a
  // nonzero denominator. This checks internal arithmetic, NOT external truth.
  const amountScales = { k: 1e3, m: 1e6, b: 1e9, million: 1e6,
    billion: 1e9, crore: 1e7, lakh: 1e5 };
  const numericBaselinePattern =
    /\bfrom\s+([$₹€£]?)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|b|million|billion|crore|lakh)?\s+to\s+([$₹€£]?)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|b|million|billion|crore|lakh)?\b/i;

  const percentageBaseline = (sentence) => {
    const match = numericBaselinePattern.exec(sentence);
    if (!match) return { clear: false, inconsistent: false };
    const [, firstCurrency, first, firstUnit, lastCurrency, last, lastUnit] = match;
    const firstScale = firstUnit?.toLowerCase() || "";
    const lastScale = lastUnit?.toLowerCase() || "";
    if (Boolean(firstCurrency) !== Boolean(lastCurrency) ||
        (firstCurrency && firstCurrency !== lastCurrency) ||
        Boolean(firstScale) !== Boolean(lastScale)) {
      return { clear: false, inconsistent: false };
    }
    // Do not mistake office/headcount changes for a revenue baseline.
    const after = sentence.slice(match.index + match[0].length);
    if (/^\s*(?:offices?|stores?|branches?|locations?|employees?|teams?|projects?|products?)\b/i.test(after) &&
        /\b(?:revenue|users?|customers?)\b/i.test(sentence)) {
      return { clear: false, inconsistent: false };
    }
    if (/\brevenue\b/i.test(sentence) &&
        !firstCurrency && !/^(?:m|b|million|billion|crore|lakh)$/.test(firstScale)) {
      return { clear: false, inconsistent: false };
    }
    const start = Number(first.replace(/,/g, "")) * (amountScales[firstScale] || 1);
    const end = Number(last.replace(/,/g, "")) * (amountScales[lastScale] || 1);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0) {
      return { clear: false, inconsistent: false };
    }
    const stated = /\b(\d+(?:\.\d+)?)\s*%/.exec(sentence);
    if (!stated) return { clear: true, inconsistent: false };
    const actual = 100 * (end - start) / start;
    const decline = /\b(?:fell|declined|decreased|dropped|down)\b/i.test(sentence);
    const increase = /\b(?:grew|growth|increased|increase|rose|up|gained)\b/i.test(sentence);
    const expected = Number(stated[1]) * (decline && !increase ? -1 : 1);
    const inconsistent = increase || decline
      ? Math.abs(actual - expected) > 0.75
      : Math.abs(Math.abs(actual) - Number(stated[1])) > 0.75;
    return { clear: true, inconsistent };
  };

  // One grammatical sentence can report independent metrics separated by
  // contrastive or coordinating clauses. Evaluate each explicit clause in
  // isolation; a baseline in one claim cannot validate a different claim.
  // Split unpunctuated coordinating/contrastive conjunctions only when
  // followed by an explicit second metric and change verb. Otherwise keep conjunctions intact: "sales and
  // marketing" is not a new numerical assertion. This is a conservative
  // structural heuristic, not a complete natural-language parser.
  const splitClaimClauses = (sentence) =>
    sentence.split(/;\s*|,\s*(?:but|while|whereas|and)\s+|\s+(?:and|but|while|whereas)\s+(?=(?:revenue|costs?|users?|customers?|profits?|sales|expenses?|funding|headcount)\s+(?:grew|rose|fell|declined|decreased|dropped|increased|reached|changed)\b)/i)
      .map(normalizeWhitespace).filter(Boolean);

  const inferMissingContext = (text) => {
    const missing = [];
    // Evaluate evidence locally. An unrelated clause must not "validate" a
    // percentage, user count, revenue figure, funding claim or growth window.
    for (const sentence of splitSentences(text).flatMap(splitClaimClauses)) {
      if (/\b\d+(?:\.\d+)?%/.test(sentence)) {
        const baseline = percentageBaseline(sentence);
        if (!baseline.clear) missing.push("Percentage change is given without a clear baseline.");
        if (baseline.inconsistent) missing.push("Percentage change conflicts with the stated from/to values.");
      }
      if (/\b(?:users?|customers?)\b/i.test(sentence) && !/active|paying|registered|monthly|daily|retained/i.test(sentence)) {
        missing.push("User/customer metric is not clearly defined.");
      }
      if (/\brevenue\b/i.test(sentence) && !/[$₹€£]|crore|lakh|million|billion|\bk\b|\bm\b/i.test(sentence)) {
        missing.push("Revenue is mentioned without an absolute amount.");
      }
      if (/\b(?:raised|funding|round)\b/i.test(sentence) && !/seed|series|pre-seed|debt|grant|valuation|lead investor/i.test(sentence)) {
        missing.push("Funding claim omits round structure or investor context.");
      }
      if (/\b(?:grew|growth|increase|increased|up)\b/i.test(sentence) && !/\b(?:month|quarter|year|week|day|yoy|mom|qoq)\b/i.test(sentence)) {
        missing.push("Growth claim does not specify a time window.");
      }
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
    // Separate independently asserted contrastive/semicolon clauses before
    // applying epistemic filters. A forecast in one clause must not erase an
    // observed, self-reported metric in another clause of the same sentence.
    // Preserve unsplittable sentences conservatively rather than guessing.
    const claimClauses = sentences.flatMap(splitClaimClauses);
    const opinions = claimClauses.filter(isOpinion);
    const predictions = claimClauses.filter(isPrediction);
    const factualClaims = claimClauses.filter(looksFactual);
    // The classifier emits candidates only; it never verifies their truth.
    const claims = factualClaims
      .map((sentence) => ({
        text: stripGlaze(sentence),
        status: "self_reported",
        verification: "not_checked"
      }))
      .filter((claim) => claim.text.length > 3)
      .slice(0, 12);

    const numbers = unique(normalized.match(numberExtractor) || []).slice(0, 20);
    const sourceLinks = unique(
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
      // A linked URL is only a lead, never verified evidence.
      sourceLinks,
      evidenceLinks: [],
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
