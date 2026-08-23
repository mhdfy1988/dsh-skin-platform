/** Shared Host and Client contracts for the skin platform. */

/** Current declarative skin package protocol. */
export const SKIN_API_VERSION = 2 as const

/** Durable settings namespace owned by the skin runtime. */
export const SKIN_SETTINGS_NAMESPACE = 'skin-runtime'

/** Durable sentinel selecting the unmodified Harness appearance. */
export const DEFAULT_SKIN_ID = 'none'

/** Same-origin Host endpoint for the one user-owned background image. */
export const CUSTOM_BACKGROUND_ROUTE = '/skin-assets/user/background'

/** How a user-owned background fills the viewport. */
export type CustomBackgroundFit = 'cover' | 'contain'

/** Stable viewport anchors exposed by the background editor. */
export type CustomBackgroundPosition = 'center' | 'top' | 'bottom' | 'left' | 'right'

/** User-owned background state stored as one atomic settings field. */
export interface CustomBackgroundSettings {
  /** Whether the stored image currently replaces the skin package background. */
  enabled: boolean
  /** SHA-256 revision returned after the Host accepts an image; empty means no image. */
  revision: string
  /** Viewport fill mode. */
  fit: CustomBackgroundFit
  /** Viewport anchor. */
  position: CustomBackgroundPosition
  /** Image layer opacity from 0.15 through 1. */
  opacity: number
  /** Image blur radius in CSS pixels from 0 through 24. */
  blur: number
  /** Black readability veil opacity from 0 through 0.85. */
  shade: number
}

/** Fresh default for a profile that has no user-owned background. */
export function defaultCustomBackground(): CustomBackgroundSettings {
  return {
    enabled: false,
    revision: '',
    fit: 'cover',
    position: 'center',
    opacity: 1,
    blur: 0,
    shade: 0.28,
  }
}

/** Host-backed skin preferences. */
export interface SkinSettings {
  /** Selected skin id, or `none` for the default Harness appearance. */
  activeSkinId: string
  /** Whether package-provided ambient motion may run. */
  motionEnabled: boolean
  /** Local user-owned image and its display treatment. */
  customBackground: CustomBackgroundSettings
}

/** One explicit static asset owned by a skin package. */
export interface SkinAssetDefinition {
  /** Request path inside this skin package, without a leading slash. */
  path: string
  /** Absolute filesystem path resolved by the package Host plugin. */
  filePath: string
  /** Response Content-Type. */
  contentType: string
}

/** Host registration for all static assets owned by one skin package. */
export interface SkinAssetPack {
  /** Stable skin id shared with the Client definition. */
  id: string
  /** Explicit file allowlist. */
  assets: readonly SkinAssetDefinition[]
}

/** One light/dark-safe official theme-token override. */
export interface SkinTokenModes {
  /** Value used with the light Harness palette. */
  light: string
  /** Value used with the dark Harness palette. */
  dark: string
}

/** Declarative color token layer applied by the shared runtime. */
export type SkinTokenOverrides = Record<string, SkinTokenModes>

/** How one skin composes with the official Harness appearance preference. */
export type SkinColorScheme = 'adaptive' | 'fixed-light' | 'fixed-dark'

/** Runtime-owned body treatment for one skin. */
export interface SkinAppearance {
  /** Background asset exposed through the runtime route. */
  backgroundUrl: string
  /** CSS background-position value. */
  backgroundPosition: string
  /** Primary decoration color. */
  accent: string
  /** Secondary glow color. */
  glow: string
  /** Characterful CSS font-family stack. */
  fontFamily: string
}

/** Optional non-interactive ornament rendered through `shell.overlay`. */
export interface SkinOverlayDefinition {
  /** Short monogram displayed in the ornament. */
  monogram: string
  /** Small contextual label. */
  eyebrow: string
  /** Main ornament label. */
  title: string
  /** Edge used by the ornament. */
  side: 'left' | 'right'
}

/** Declarative Client registration supplied by one skin package. */
export interface SkinPack {
  /** Exact runtime protocol version. */
  apiVersion: typeof SKIN_API_VERSION
  /** Stable globally unique id. */
  id: string
  /** User-facing name. */
  name: string
  /** Compact catalog description. */
  description: string
  /** Package version. */
  version: string
  /** Supported Harness version range, surfaced for diagnosis. */
  dshRange: string
  /** Whether official light/dark changes select token branches while this skin is active. */
  colorScheme: SkinColorScheme
  /** Preview asset URL. */
  previewUrl: string
  /** Official theme-token layer. */
  tokens: SkinTokenOverrides
  /** Runtime-owned background and typography values. */
  appearance: SkinAppearance
  /** Optional frame-wide ornament. */
  overlay?: SkinOverlayDefinition
}
