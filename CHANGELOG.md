# Changelog

All notable changes to **Vortex Live TV** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.7.1] - 2026-09-04

### Fixed
- **Stream Status Synchronization & CORS Playback**:
  - **4-Stage Stream Loader**: Upgraded `HoverPreviewPlayer` with a 4-tier playback fallback strategy (Direct HLS -> Proxied HLS -> Direct Video -> Proxied Video) to play CORS-protected streams smoothly on hover.
  - **Real Stream Verification**: Removed generic string matching (like `'stream.m3u8'` and `'iptv-org'`) that falsely marked unverified channels as online.
  - **Hover Error Status Sync**: Tied `HoverPreviewPlayer` playback failure directly to `markChannelOffline`, immediately updating card status badges to "Offline" when a stream fails to load.

---

## [v1.7.0] - 2026-09-04

### Changed
- **Full-Bleed Edge-to-Edge Channel Cards**:
  - **Eliminated Black Bars**: Redesigned channel grid and list cards so media previews (logos and live hover video streams) fill the top 16:9 banner edge-to-edge without inner borders or padding box artifacts.
  - **Overlaid Translucent Badges**: Positioned group badges and favorite controls directly on top of the media stage with backdrop-blur dark pills.
- **Professional Minimalist UI/UX Overhaul**:
  - **Obsidian Dark Canvas**: Designed a clean, high-contrast dark palette (`#09090b` canvas with `#121215` cards and `#e11d48` crimson accents) with subtle borders (`border-zinc-800/60`).
  - **Sleek Top Navigation Bar**: Added search input with `/` keyboard shortcut trigger, fast source drawer toggle, and probe health triggers.
  - **Horizontal Category Tab Ribbon**: Clean category navigation pills with live item count badges and crisp active highlights.

---

## [v1.6.0] - 2026-09-04

### Added
- **Customizable Page Size Selector**: Users can now choose `12`, `24`, `48`, `96`, or `200` channels per page, with preferences persisted in `localStorage`.
- **Advanced Multi-Dimensional Filtering**:
  - Added **Country Filter** dropdown extracting all unique country codes from playlist feeds.
  - Added **Language Filter** dropdown extracting broadcast languages.
  - Added **Category Counts**: Displays total channel counts next to every category in the selector.
  - Added **Sorting Engine**: Sort channels alphabetically (A–Z / Z–A), by **Working Online Status First**, or by **Lowest Ping Latency**.
- **Active Filter Pills & Quick Clear**: Interactive filter tags showing active selections with 1-click removal and a "Clear All Filters" button.

---

## [v1.5.1] - 2026-09-04

### Added
- **Hover Channel Live Stream Preview**: Hovering over any channel card in grid or list view instantly tunes and plays the live HLS stream directly inside the card frame with a "LIVE" indicator and volume toggle.
- **Ultra-Fast Stream Health Engine**:
  - **32-Worker Concurrency Pool**: Doubled batch check concurrency from 16 to 32 parallel background workers.
  - **Sub-100ms HEAD Probe**: Direct `no-cors` HEAD requests resolve stream reachability in 10-100ms without CORS blockage or proxy delays.
  - **Instant Hover Verification**: Successfully previewed streams on hover are automatically marked online with verified latency.

---

## [v1.5.0] - 2026-09-04

### Changed
- **Dedicated Minimal TV Portal App**: Made the entire application launch directly into a sleek, minimal Live TV interface focused on open television streams, news, sports, and entertainment.
- **Ultra-Fast Channel Health Check Engine**:
  - **Parallel Race Strategy**: Simultaneously probes direct range GET requests alongside fast CORS proxies using `Promise.race` for instant <300ms verification.
  - **Session Persistence & Caching**: Remembers verified stream health statuses in `sessionStorage` for 0ms cached lookups.
  - **16-Worker Concurrency Pool**: Scaled batch probe worker queue from 4 to 16 parallel workers, allowing 24-48 page channels to be health-checked in ~1 second.
- **Minimalist TV UI/UX**:
  - Clean top bar with search, instant feed presets, and rapid health probe triggers.
  - Streamlined category, country, language, and working channel filter chips.
  - High-density minimal bento grid & list cards displaying channel logo, latency ping, category badge, and 1-click play.
  - Keyboard zapping support (`PageUp` / `PageDown`) for instant channel switching.

---

## [v1.4.0] - 2026-09-04

### Added
- **Dedicated Broadcast Portal UI**: Transformed the Live TV view into an expansive, cinematic broadcast portal with deep dark themes, ambient illumination accents, and high-contrast typography.
- **Hero Spotlight Channel of the Day**: Added an immersive featured broadcast banner showcasing verified premier streams (e.g., NASA TV HD, DW News Global, France 24, Red Bull TV) with 1-click live launch and ping statistics.
- **Multi-Dimensional Filters**:
  - **Category Topics**: Quick-filtering with real-time channel count badges across all topics.
  - **Country & Regional Filter**: Dropdown filtering by country code and origin.
  - **Language Filter**: Instant filtering by broadcast language (English, Spanish, French, German, Hindi, etc.).
  - **Channel Health Status**: Quick filter chips for Working Online, Offline, and Untested channels.
  - **Favorites & Watchlist**: Channel bookmarking system with persistence via `localStorage`.
- **Tri-View Display Modes**: Seamless switching between **Bento Grid Cards**, **Broadcast EPG Table**, and **Wide Cinematic Cards**.
- **Pagination & High-Performance Batching**: Smooth paginated rendering (24, 36, or 72 per page) ensuring fluid scrolling and responsive interaction across playlists with thousands of channels.
- **Curated Feeds & Custom Drawer**: Collapsible custom M3U source configuration supporting direct URL inputs, local `.m3u` file uploads, and curated global category/country presets.

---

## [v1.3.0] - 2026-09-04

### Changed
- **Full-Screen Live TV Experience**: Refactored the TV channel list out of the modal/popup dialog into an expansive, dedicated full-page TV guide view.
- **Top Bar & Launcher Integration**: Directly accessible via "Live TV Guide" in the top player bar, the home launcher, and player error fallback buttons without opening any popup window.
- **Return Navigation & Stream Continuity**: Added a persistent header back button ("Back to Video" / "Back to Home") and a sticky bottom banner indicating the active background stream with instant 1-click return to playback.
- **Clean Modal Separation**: The standard Media Library popup now focuses strictly on Sample Movies, Recent History, Network URLs, and Local Files, while routing any Live TV requests directly to the full-page guide.

---

## [v1.2.0] - 2026-09-04

### Added
- **Live Channel Health Diagnostics**: Instant ping, latency check, and HTTP/HLS status verification for every IPTV stream.
- **Health Indicators**: Working channels display with glowing green badges (`ONLINE • xx ms`), while offline channels are marked (`OFFLINE`) before clicking.
- **Working Only Filter**: Instant filter toggle to display only 100% verified online and playable live streams.
- **Channel Sorting**: Sort channels by Health First (Online top), Fastest Ping (Latency ms), Alphabetical (A-Z), and Category Group.
- **Dual View Modes**: Switch between Modern Broadcast Card Grid and Compact Broadcast Table/List view.
- **Batch Health Scanner**: Automated background scanner with real-time progress bar to probe and verify up to 50 channels at a time.
- **Individual Channel Re-Test**: On-demand probe button for each channel to test latency and availability independently.
- **Live TV Indicator in Catalog**: Real-time broadcast pulse badges on sample 24/7 channels (NASA TV HD, DW News, France 24, Red Bull TV).

### Changed
- Modernized IPTV TV Guide UI with Netflix/YouTube TV dark aesthetics, responsive spacing, and high contrast typography.
- Widened modal dialog container for IPTV Guide navigation.

---

## [v1.1.0] - 2026-08-04

### Added
- Multi-proxy CORS failover mechanism with intelligent fallback (Direct, corsproxy.io, allorigins, thingproxy).
- Additional 24/7 high-bitrate live television stations (NASA TV HD, DW News English, France 24, Red Bull TV, Akamai HLS).
- Expanded IPTV categories and regional playlists (Sports, Entertainment, Documentary, UK, US, India).

---

## [v1.0.0] - 2026-08-03

### Added
- Initial release of Vortex Local Video Player by Suhail Akhtar (suhail.top).
- Multi-track audio switching, spatial equalizer, and subtitle styling.
- Local video file playback, MKV stream extraction, and P2P sync rooms.
