# Changelog

All notable changes to **Vortex Video Player** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
