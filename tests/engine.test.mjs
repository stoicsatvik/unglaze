import assert from "node:assert/strict";
await import("../src/core/engine.js");
const { analyze, stripGlaze, inferMissingContext } = globalThis.UnglazeCore;
assert.equal(stripGlaze("Thrilled to announce we raised $1.2M in seed funding."),"we raised $1.2M in seed funding.");
const result=analyze({text:"Thrilled to announce that we grew 200%! We now have 10,000 users. I think this is the best product in the market.",links:["https://example.com/report","javascript:alert(1)","https://example.com/report"]});
assert.ok(result.promotionalLanguage.includes("thrilled to announce"));
assert.ok(result.numbers.some(item=>item.includes("200%")));assert.ok(result.numbers.some(item=>item.includes("10,000")));
assert.ok(result.missingContext.includes("Percentage change is given without a clear baseline."));assert.ok(result.missingContext.includes("User/customer metric is not clearly defined."));
assert.deepEqual(result.evidenceLinks,["https://example.com/report"]);assert.ok(result.opinions.length>=1);
assert.equal(result.provenance.length,result.claims.length);
for(const record of result.provenance){assert.equal(record.claimStatus,"self_reported");assert.equal(record.verificationState,"unverified");assert.deepEqual(record.evidence,[{url:"https://example.com/report",relation:"linked_not_verified",supportsClaim:false}]);}
const noLink=analyze({text:"We reached 5,000 users."});assert.equal(noLink.provenance[0].verificationState,"unverified");assert.deepEqual(noLink.provenance[0].evidence,[]);
const gaps=inferMissingContext("Revenue grew 50%.");assert.ok(gaps.includes("Percentage change is given without a clear baseline."));assert.ok(gaps.includes("Revenue is mentioned without an absolute amount."));
console.log("Unglaze engine tests passed.");
