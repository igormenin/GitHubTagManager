# Changelog

All notable changes to the "GitHub Tag Manager" extension will be documented in this file.

## [0.4.0] - 2026-06-04

### Added
- Modular anonymous telemetry system using PostHog to track active usage and key interactions (tag creation, pushing, deleting, repository initialization) to improve the extension.
- Local consent prompt on first startup explaining telemetry, dynamically localized in Portuguese and English.
- Local configuration setting `github-tag-manager.telemetry.enabled` allowing users to opt-in or opt-out of telemetry individually for this extension.

## [0.3.5] - 2026-06-03

### Changed
- README.md badge layout and alignment adjustments.

## [0.3.4] - 2026-06-03

### Changed
- Added dynamic status and marketplace badges to README.md.

## [0.3.3] - 2026-06-03

### Added
- Configuration files and metadata adjustments to publish the extension to the VS Code Marketplace.

## [0.3.2] - 2026-05-22

### Added
- Search keywords/tags to `package.json` to make the extension more discoverable in Open VSX.

## [0.3.1] - 2026-05-22

### Changed
- Moved the extension marketplace icon back to the root level (`icon.png`) to ensure compatibility with Open VSX.

## [0.3.0] - 2026-05-22

### Added
- Dynamic Git remote configuration check upon extension opening.
- Prominent red warning banner at the top of the extension when no Git remote is configured.
- "Revalidate" button inside the error banner to trigger configuration checks dynamically.
- Complete visual lock of extension functionalities (panels rendered with 40% opacity and disabled pointer events) until a remote is configured and successfully validated.

### Changed
- Translated the extension manifest (`package.json`) description to English.
- Reorganized assets structure (moved screenshots and icon to root `img/` folder) and updated paths in README.
- Added the extension icon to the top of the README.md.

### Removed
- Unused "Git Execution Console" log panel at the bottom of the interface.

## [0.2.0] - 2026-05-20

### Added
- Complete project documentation in `README.md` containing bilingual features, usage instructions, and interface screenshots.

## [0.1.4] - 2026-05-20

### Added
- Official extension icon to the manifest (`package.json`).

## [0.1.3] - 2026-05-20

### Changed
- Updated `package.json` repository metadata and added the LICENSE file.

## [0.1.2] - 2026-05-20

### Changed
- Updated publisher name in `package.json`.

## [0.1.1] - 2026-05-20

### Changed
- Internal metadata and configuration cleanup.

## [0.1.0] - 2026-05-20

### Added
- GitHub Actions workflow for automated publishing.
- Initial functional release containing:
  - Sidebar control panel with PATCH, MINOR, and MAJOR version preview buttons.
  - Annotated and lightweight local Git tag creation.
  - Dynamic collapsable Git Tag History timeline list.
  - Execution console logs panel showing real-time CLI Git logs.
  - Bilingual interface support (English / Portuguese-Brazil).
