# LinkedIn Post URL Research

## Official desktop workflow

LinkedIn’s official help documentation states that every post has a unique URL. On desktop, the documented workflow is to click the **More** icon in the top-right corner of the post, select **Copy link to post**, and paste the resulting URL into a browser.[1]

The same documentation describes mobile variants using **Share via** followed by **Copy** or **Copy to clipboard**.[1]

## Findings from the user’s live HTML evidence

The user-provided HTML contains post-control buttons labeled `Open control menu for post by …`. The user’s latest run reports that 11 menus opened, but zero Copy link actions were detected and zero URLs were resolved. This means the current live menu state differs from the literal text assumed by the initial resolver. The debug mode therefore captures bounded visible menu roles, labels, text, links, and menu HTML after opening the control menu, allowing the next change to be based on the actual rendered state.

## API boundary

LinkedIn’s current Posts API documentation describes retrieval by post URN and author-scoped retrieval using restricted permissions such as `r_member_social` or `r_organization_social`. It does not provide a general API for reading an arbitrary member’s personalized home feed.[2] The exporter therefore does not pretend that the official API can replace the visible-feed workflow for this use case.

## Platform restrictions

LinkedIn’s help policy states that third-party software, including crawlers, automated programs, browser plug-ins, and browser extensions, is not permitted to scrape, copy, modify, or automate the service without authorization.[3] This project remains a user-invoked, visible-browser experiment and does not bypass access controls, use undocumented private endpoints, solve CAPTCHAs, or claim universal completeness.

## References

[1]: https://www.linkedin.com/help/linkedin/answer/a1340792/finding-the-url-for-shared-content?lang=en "LinkedIn Help: Find the URL for shared content"

[2]: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view "LinkedIn Marketing API: Posts API"

[3]: https://www.linkedin.com/help/linkedin/answer/a1341387 "LinkedIn Help: Prohibited software and extensions"
