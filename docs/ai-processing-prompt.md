# Downstream AI Processing Prompt

Process the attached `post-elements.json` file. Treat each array object as one independent LinkedIn feed-card capture. Use only the fields inside each object: `visibleText`, `html`, `links`, `controls`, `attributes`, `media`, `author`, and `postUrls`.

Return one JSON object per capture with this schema:

```json
{
  "captureId": "string",
  "postUrl": "string or null",
  "postUrlStatus": "verified or unresolved",
  "author": {
    "name": "string or null",
    "profileUrl": "string or null",
    "headline": "string or null"
  },
  "timestamp": "string or null",
  "postType": "post, promoted, job, repost, poll, document, video, or unknown",
  "isPromoted": true,
  "text": "string or null",
  "media": [],
  "engagement": {
    "reactions": "number or null",
    "comments": "number or null",
    "reposts": "number or null"
  },
  "socialContext": {
    "actor": "string or null",
    "action": "string or null"
  },
  "job": {
    "url": "string or null",
    "title": "string or null",
    "company": "string or null",
    "location": "string or null"
  },
  "evidence": [
    {
      "field": "string",
      "source": "visibleText, html, links, controls, attributes, media, author, or postUrls",
      "quote": "short exact source text"
    }
  ],
  "missingEvidence": ["string"]
}
```

Use these rules. A `postUrl` is `verified` only when it is a real LinkedIn post-shaped URL found in `postUrls`, `links`, `html`, or a stable LinkedIn post URN in `attributes`. Accept `/feed/update/urn:li:activity:...`, `/feed/update/urn:li:share:...`, `/feed/update/urn:li:ugcPost:...`, and valid `/posts/...` URLs. Reject `/null`, `/feed/`, company-page URLs, profile URLs, job URLs, search URLs, event URLs, and advertising landing pages.

Never infer a URL from the author profile. Never invent engagement counts, timestamps, reactions, comments, job details, or author information. If a value is not supported by exact evidence in the capture, return `null` and add a concise explanation to `missingEvidence`. For promoted cards, use `postType: "promoted"` unless the capture contains a genuine LinkedIn `/jobs/view/...` URL or explicit `View job` evidence. Preserve the `captureId` so every output row can be traced back to its original HTML evidence.
