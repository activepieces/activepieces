# Privatus Analytics

**You want to know how your website is doing, without opening another dashboard.** Most analytics
tools are slow to click through, and many use cookies. In many countries that means a cookie pop-up
(the box that asks visitors to accept cookies), and lots of people click "reject", so you never see
them.

**[Privatus Analytics](https://privatusanalytics.com) counts the visitors to your website without
cookies.** It never stores IP addresses and keeps bots out of your numbers. This piece brings those
numbers into your flows.

**So your numbers come to you.** Send a weekly visitor report to Slack, add yesterday's top pages to
a Google Sheet, or get a message the moment a goal is completed or a big wave of visitors arrives.

## Triggers

- **New Goal Conversion:** starts when a goal is completed again, like a sign-up or a purchase.
  Checked every few minutes. Pick one goal or watch them all. Completions just before midnight
  (in your site's time zone) still start the flow after the day changes.
- **Traffic Spike:** starts once when the number of people on the site right now reaches a number
  you pick, and again only after it drops below.

## Actions

- **Get Stats:** visitors, visits, pageviews, bounce rate and visit time for a period, with the
  change against the period before.
- **Get Visitors Over Time:** the same numbers for each hour, day, week or month.
- **Get Top Pages, Referrers and More:** the top pages, entry and exit pages, referrers, channels,
  campaigns, countries, languages, devices, browsers, custom events or goals.
- **Get Live Visitors:** how many people are on the site right now and what they look at.
- **List Goal Conversions:** each goal with its conversions, conversion rate and change.
- **List Sites:** your websites with their IDs and domains.
- **Custom API Call:** send your own request to the [Privatus Analytics API](https://privatusanalytics.com/docs/api).

Every action above, except Custom API Call, only reads. None of them changes or deletes anything.
Custom API Call sends whatever request you build, so it can change data if your token is allowed to.

## Connect your account

1. Log in to Privatus Analytics (the Free plan has 10,000 events a month and 3 sites, with no card).
2. Open **Workspace settings**, then **API tokens**, and create a token. It starts with `pat_`.
3. Paste it into the **API Token** field of the connection.

The triggers and the other actions talk only to `https://privatusanalytics.com`. Custom API Call adds
the path you type to that address. If you type a full web address instead, it sends the request, with
your token, to that address, so only use full addresses you trust.
