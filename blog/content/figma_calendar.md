Title: A family calendar in the kitchen
Date: 2026-11-11
Category: Figma
Tags: figma,design,ai,mcp,e-ink
Slug: figma-calendar
Authors: Jesse Lumarie
Summary: Building a Himekuri-inspired family calendar with Figma's agent, Codex, and a 32-inch e-ink display—seasonal artwork, school lunches, and all.

With the help of Figma's agent and Codex, I built some software for an e-ink calendar to display our family's activities and a little almanac for the day. Inspired by projects like [Wes Bos's smart photo frame dashboard](https://wesbos.com/hacking-smart-photo-frames), I wanted a way to see what was coming up, but I really didn't want a bright screen in my kitchen. So I'd been looking for an e-ink panel for the past few months.

<figure class="calendar-figure calendar-figure--portrait">
  <a href="{static}/images/figma-calendar/calendar-on-wall.webp"><img src="{static}/images/figma-calendar/calendar-on-wall.webp" width="900" height="1200" alt="A framed portrait e-ink calendar hanging on a kitchen wall, with a large date above a monthly calendar." decoding="async"></a>
  <figcaption>The calendar at home: today's plans up top, the month below, and no glowing screen. Calendar details have been anonymized.</figcaption>
</figure>

### Finding the panel

The problem: the 32-inch panels I kept finding cost more than $1,500. This is too much money. But, for reasons I still don't understand, I found a [Samsung EM32DX on Newegg](https://www.newegg.com/samsung-em32dx/p/15Z-001C-00D50) for about $600. Still not cheap, but a much better price.

While the panel charged, I hooked up my computer so Codex could set up the display and the calendar service. I'd seen this [Himekuri calendar](https://www.bestmadeco.com/products/japanese-daily-calendar-2027), and wanted something similar in vibes: a big date, a clear view of the day, and the feel of a paper calendar. I kicked it off with a prompt:

<figure class="calendar-figure">
  <a href="{static}/images/figma-calendar/initial-prompt.webp"><img src="{static}/images/figma-calendar/initial-prompt.webp" width="1522" height="426" alt="The initial Codex prompt asking for a Himekuri-style calendar, a Mac mini service, and a local interface." loading="lazy" decoding="async"></a>
  <figcaption>The starting brief for Codex: get the panel working, run the service on my Mac mini, and give me a local interface to adjust it.</figcaption>
</figure>

### Designing a year at once

I workshopped the initial look while I was out. Once I had an image of what I wanted, I used the Figma MCP server to lay out the months and see how the calendar would look throughout the year.

<div class="calendar-gallery calendar-gallery--progression" role="group" aria-label="Calendar design progression from green to blue to orange">
  <figure class="calendar-figure">
    <a href="{static}/images/figma-calendar/progression-green.webp"><img src="{static}/images/figma-calendar/progression-green.webp" width="900" height="1600" alt="The first calendar design, with a muted green date panel and a simple monthly grid." loading="lazy" decoding="async"></a>
    <figcaption>1. Green: the first pass, with a restrained palette and a big date beside the day's plans.</figcaption>
  </figure>
  <figure class="calendar-figure">
    <a href="{static}/images/figma-calendar/progression-blue.webp"><img src="{static}/images/figma-calendar/progression-blue.webp" width="900" height="1600" alt="The next calendar design, with blue borders, paper texture, handwritten details, and an illustration of the Flatirons." loading="lazy" decoding="async"></a>
    <figcaption>2. Blue: paper texture, handwritten details, and the Flatirons bring in more personality.</figcaption>
  </figure>
  <figure class="calendar-figure">
    <a href="{static}/images/figma-calendar/progression-orange.webp"><img src="{static}/images/figma-calendar/progression-orange.webp" width="900" height="1600" alt="The later calendar design, with large orange numerals and an autumn leaf motif in the upper-right corner." loading="lazy" decoding="async"></a>
    <figcaption>3. Orange: warmer colors and an autumn leaf motif move it toward the seasonal design.</figcaption>
  </figure>
</div>

It's so much easier to understand the whole design when the pieces are spread out on a canvas. I could compare the colors across months, adjust the layout, and make the seasonal artwork feel like it belonged to the same calendar.

<div class="calendar-gallery">
  <figure class="calendar-figure">
    <a href="{static}/images/figma-calendar/seasonal-palettes.webp"><img src="{static}/images/figma-calendar/seasonal-palettes.webp" width="1600" height="1300" alt="A Figma palette board comparing the calendar's accent, secondary, highlight, ink, wash, and paper colors across the year." loading="lazy" decoding="async"></a>
    <figcaption>A year of color in one view. Each month gets its own palette while the paper stays white.</figcaption>
  </figure>
  <figure class="calendar-figure">
    <a href="{static}/images/figma-calendar/seasonal-motifs.webp"><img src="{static}/images/figma-calendar/seasonal-motifs.webp" width="1102" height="896" alt="Twelve seasonal botanical motifs arranged in Figma, from winter pine and snowflakes to autumn leaves and holiday holly." loading="lazy" decoding="async"></a>
    <figcaption>The twelve seasonal motifs together: snowflakes, flowers, summer grasses, and autumn leaves.</figcaption>
  </figure>
</div>

Tweaking little things, like where the bats or snowflakes sit among the branches, was easy with the Figma agent. Once I was happy with them, I could export the artwork through the MCP server.

<figure class="calendar-figure calendar-figure--detail">
  <a href="{static}/images/figma-calendar/october-motif.webp"><img src="{static}/images/figma-calendar/october-motif.webp" width="700" height="340" alt="October's calendar artwork: warm maple leaves on branches with small purple bats flying underneath." loading="lazy" decoding="async"></a>
  <figcaption>A closer look at October, exported from Figma. Small adjustments to the bats and leaves are much easier to judge on the canvas.</figcaption>
</figure>

### School lunch and the mini in the closet

My kids get lunch through their school, so I also made a little widget to show what's on the menu. Figma made it easy to view the illustrations together, tweak each generation, and keep them in line with the Himekuri feel.

I have a Mac mini in a closet that runs a bunch of little sites for my house. The calendar service lives there too. I added controls so I can remove calendars, have Luna shorten event names, and use the Luna Decisions API to work out whether an entry on my calendar is a duplicate of one on my wife's.

<div class="calendar-gallery calendar-gallery--details">
<figure class="calendar-figure calendar-figure--portrait">
  <a href="{static}/images/figma-calendar/lunch-illustrations.webp"><img src="{static}/images/figma-calendar/lunch-illustrations.webp" width="1043" height="1200" alt="A Figma sheet of small hand-drawn school lunch illustrations, including sandwiches, pasta, pizza, and bowls of food." loading="lazy" decoding="async"></a>
  <figcaption>The lunch illustration sheet. Even a tiny menu widget should feel like part of the calendar.</figcaption>
</figure>

<figure class="calendar-figure calendar-figure--controls">
  <a href="{static}/images/figma-calendar/calendar-controls.webp"><img src="{static}/images/figma-calendar/calendar-controls.webp" width="856" height="1269" alt="The calendar's local controls showing calendar sync status, refresh and send buttons, and a duplicate-entry review with an explanation." loading="lazy" decoding="async"></a>
  <figcaption>The local controls: sync status, sending an update to the panel, and a review when two calendar entries might be the same event.</figcaption>
</figure>
</div>

### Still plugged in

I really love how this looks in the house, and that it's a service I can easily update. If I see something that I don't like, I ask my dot to change it, and it kicks off a Codex thread to update everything, which then updates my designs in Figma. Truly personal software.

My only gripe right now is battery life. [Samsung's manual](https://store.visionbox.it/wp-content/uploads/2025/10/BN81-27642A-01_WUG_EM32DX_EU_ENG_250716.1.pdf#page=27) describes about 200 days on a charge, but that's with one screen refresh a day and without using Wi-Fi or the mobile app. It recommends the charger when using the mobile app or VXT Player app. That's a different setup from my running calendar.

If I could get closer to 30 days, I'd happily leave it unplugged. For now, that part is still a work in progress.
