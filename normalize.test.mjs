import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizePostUrl,
  dedupeRecords,
  extractEngagement,
  extractJob,
  normalizeSnapshot,
  parseCount,
  parsePostId,
} from "./lib/normalize.mjs";

test("parseCount handles exact, thousands, and millions", () => {
  assert.equal(parseCount("1,234"), 1234);
  assert.equal(parseCount("2.5K"), 2500);
  assert.equal(parseCount("1.2M"), 1200000);
});

test("parsePostId prefers stable LinkedIn activity identifiers", () => {
  assert.equal(parsePostId("https://www.linkedin.com/feed/update/urn:li:activity:1234567890123456789/"), "urn:li:activity:1234567890123456789");
  assert.equal(parsePostId("https://www.linkedin.com/posts/example_title-1234567890123456789"), "1234567890123456789");
});

test("extractEngagement reads the visible labels without guessing missing values", () => {
  assert.deepEqual(extractEngagement("1,234 reactions 56 comments 7 reposts"), {
    reactions: 1234,
    comments: 56,
    reposts: 7,
  });
  assert.deepEqual(extractEngagement("No visible counts"), {
    reactions: null,
    comments: null,
    reposts: null,
  });
});

test("extractJob keeps job records linked to the source post", () => {
  const job = extractJob({
    postId: "1234567890123",
    job: { url: "https://www.linkedin.com/jobs/view/987654321/", title: "Staff Engineer" },
    rawText: "Staff Engineer at Example Co · Remote · View job",
  });
  assert.equal(job.jobId, "https://www.linkedin.com/jobs/view/987654321");
  assert.equal(job.sourcePostId, "1234567890123");
  assert.equal(job.title, "Staff Engineer");
});

test("rejects fake, company-page, and unresolved URLs instead of presenting them as post links", () => {
  assert.equal(canonicalizePostUrl("https://www.linkedin.com/null"), null);
  assert.equal(canonicalizePostUrl("https://www.linkedin.com/company/example/posts"), null);
  assert.equal(canonicalizePostUrl("https://www.linkedin.com/feed/update/urn:li:share:7494016921496031232"), "https://www.linkedin.com/feed/update/urn:li:share:7494016921496031232");

  const record = normalizeSnapshot({
    postUrl: "https://www.linkedin.com/company/example/posts",
    postUrlCandidates: ["https://www.linkedin.com/company/example/posts"],
    text: "Sponsored example",
    rawText: "Feed post\n\nExample Company\n\nPromoted\n\nSponsored example\n\n5d •",
    isPromoted: true,
    author: { name: "Example Company", profileUrl: "https://www.linkedin.com/company/example/posts" },
    engagementLabels: ["3,634 reactions", "16 comments"],
  }, "https://www.linkedin.com/feed/", "2026-08-18T03:21:19.000Z");

  assert.equal(record.postUrl, null);
  assert.equal(record.postUrlStatus, "unresolved");
  assert.equal(record.crossCheckUrl, null);
  assert.equal(record.postType, "promoted");
  assert.equal(record.relativeTime, "5d");
  assert.equal(record.engagement.reactions, 3634);
  assert.equal(record.engagement.comments, 16);
});

test("normalizes a real feed URL and strips degree suffixes from author names", () => {
  const record = normalizeSnapshot({
    postUrl: "https://www.linkedin.com/feed/update/urn:li:share:7494016921496031232/",
    text: "A real post",
    rawText: "Feed post\n\nLavanya Jain • 1st\n\n5d •\n\nA real post",
    author: { name: "Lavanya Jain • 1st", profileUrl: "https://www.linkedin.com/in/ilavanyajain" },
  }, "https://www.linkedin.com/feed", "2026-08-18T03:21:19.000Z");

  assert.equal(record.postUrlStatus, "verified");
  assert.equal(record.crossCheckUrl, "https://www.linkedin.com/feed/update/urn:li:share:7494016921496031232");
  assert.equal(record.postId, "urn:li:share:7494016921496031232");
  assert.equal(record.author.name, "Lavanya Jain");
  assert.equal(record.relativeTime, "5d");
});

test("dedupeRecords merges longer text and engagement entities", () => {
  const merged = dedupeRecords([
    { postId: "1", text: "short", rawText: "short", comments: [], reactions: [] },
    { postId: "1", text: "a longer version", rawText: "a longer version", comments: [{ id: "c1" }], reactions: [{ id: "r1" }] },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, "a longer version");
  assert.deepEqual(merged[0].comments, [{ id: "c1" }]);
  assert.deepEqual(merged[0].reactions, [{ id: "r1" }]);
});
