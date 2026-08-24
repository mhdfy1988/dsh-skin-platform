/** Client registration for the Dream Journey skin. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinPack } from 'dsh-skin-runtime/client'
import type {} from 'dsh-skin-runtime/client'

export const inject = ['skinRuntime']

/** Declarative porcelain-and-jade palette; the package performs no direct DOM mutation. */
export const pack: SkinPack = {
  apiVersion: 2,
  id: 'dream-journey',
  name: '梦境仙游',
  description: '瓷白云境、桃花暖粉、天青玉色与轻金描边组成的可爱国风工作台。',
  version: '0.1.1-rc.1',
  dshRange: '0.1.1-rc.2',
  colorScheme: 'fixed-light',
  previewUrl: '/skin-assets/dream-journey/background.png',
  tokens: {
    '--dsw-alias-bg-base': { light: 'rgba(242,251,250,.58)', dark: 'rgba(237,248,247,.64)' },
    '--dsw-alias-bg-layer-1': { light: 'rgba(255,253,247,.90)', dark: 'rgba(249,252,247,.92)' },
    '--dsw-alias-bg-layer-2': { light: 'rgba(255,250,244,.95)', dark: 'rgba(246,250,246,.96)' },
    '--dsw-alias-bg-layer-3': { light: 'rgba(255,252,247,.98)', dark: 'rgba(247,251,247,.98)' },
    '--dsw-alias-bg-overlay': { light: 'rgba(255,253,249,.99)', dark: 'rgba(249,252,248,.99)' },
    '--dsw-alias-bg-module-platform': { light: 'rgba(255,252,247,.98)', dark: 'rgba(248,251,247,.98)' },
    '--dsw-alias-border-l1': { light: 'rgba(90,155,151,.22)', dark: 'rgba(80,145,142,.24)' },
    '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(75,151,149,.30)', dark: 'rgba(67,139,138,.32)' },
    '--dsw-alias-border-l2': { light: 'rgba(64,151,149,.38)', dark: 'rgba(58,138,137,.40)' },
    '--dsw-alias-border-l3': { light: 'rgba(51,151,151,.55)', dark: 'rgba(47,137,138,.57)' },
    '--dsw-alias-border-l4': { light: 'rgba(197,151,72,.58)', dark: 'rgba(181,135,62,.59)' },
    '--dsw-alias-brand-primary': { light: '#24777b', dark: '#216f73' },
    '--dsw-alias-brand-text': { light: '#1f7478', dark: '#1d6c70' },
    '--dsw-alias-label-primary': { light: '#23484b', dark: '#204347' },
    '--dsw-alias-label-primary-foreground': { light: '#ffffff', dark: '#ffffff' },
    '--dsw-alias-label-secondary': { light: '#4e696c', dark: '#496366' },
    '--dsw-alias-label-tertiary': { light: '#567174', dark: '#516a6d' },
    '--dsw-alias-label-caption': { light: '#60787b', dark: '#596f72' },
    '--dsw-alias-markdown-code-block': { light: 'rgba(250,255,252,.97)', dark: 'rgba(246,252,249,.98)' },
    '--dsw-alias-markdown-code-block-banner': { light: 'rgba(224,244,241,.98)', dark: 'rgba(216,238,236,.99)' },
    '--dsw-alias-button-primary-fill': { light: '#24777b', dark: '#216f73' },
    '--dsw-alias-button-primary-hover': { light: '#1d676b', dark: '#1b6064' },
    '--dsw-alias-button-info-fill': { light: '#c24764', dark: '#b9405c' },
    '--dsw-alias-button-info-hover': { light: '#ad3654', dark: '#a1304d' },
    '--dsw-alias-button-elevated-fill': { light: 'rgba(255,253,248,.98)', dark: 'rgba(249,252,248,.98)' },
    '--dsw-alias-button-floating-fill': { light: 'rgba(255,250,244,.98)', dark: 'rgba(247,251,247,.98)' },
    '--dsw-alias-button-floating-hover': { light: 'rgba(232,127,155,.22)', dark: 'rgba(221,116,143,.24)' },
    '--dsw-alias-button-ghost-active-border': { light: '#46aaad', dark: '#3e999d' },
    '--dsw-alias-button-ghost-active-fill': { light: 'rgba(78,179,181,.16)', dark: 'rgba(70,163,166,.18)' },
    '--dsw-alias-button-ghost-active-hover': { light: 'rgba(78,179,181,.23)', dark: 'rgba(70,163,166,.25)' },
    '--dsw-alias-interactive-bg-active': { light: 'rgba(82,179,181,.16)', dark: 'rgba(72,163,166,.18)' },
    '--dsw-alias-interactive-bg-hover': { light: 'rgba(232,127,155,.10)', dark: 'rgba(221,116,143,.12)' },
    '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(232,127,155,.18)', dark: 'rgba(221,116,143,.20)' },
    '--dsw-alias-interactive-bg-hover-solid': { light: 'rgba(225,245,242,.89)', dark: 'rgba(216,239,236,.91)' },
    '--dsw-alias-state-business-primary': { light: '#1f7478', dark: '#1d6c70' },
    '--dsw-alias-state-business-tertiary': { light: 'rgba(47,157,161,.14)', dark: 'rgba(43,143,148,.16)' },
    '--dsw-alias-state-error-primary': { light: '#c24764', dark: '#b9405c' },
    '--dsw-alias-state-success-primary': { light: '#28745f', dark: '#246b58' },
    '--dsw-alias-state-warn-label': { light: '#8a5b16', dark: '#805314' },
    '--dsw-alias-scrollbar-bg-l1': { light: 'rgba(83,154,153,.22)', dark: 'rgba(76,143,142,.24)' },
    '--dsw-alias-scrollbar-bg-l2': { light: 'rgba(224,135,157,.27)', dark: 'rgba(211,124,148,.29)' },
    '--dsw-alias-scrollbar-hover-l1': { light: 'rgba(56,143,143,.39)', dark: 'rgba(50,131,132,.41)' },
    '--dsw-alias-scrollbar-hover-l2': { light: 'rgba(213,112,139,.43)', dark: 'rgba(201,103,131,.45)' },
    '--dsw-specific-bubble': { light: 'rgba(255,225,233,.90)', dark: 'rgba(252,220,229,.92)' },
    '--dsw-specific-input-major': { light: 'rgba(255,255,252,.97)', dark: 'rgba(249,253,249,.97)' },
    '--dsw-specific-menu': { light: 'rgba(255,253,248,.98)', dark: 'rgba(248,252,248,.99)' },
    '--dsw-specific-selector': { light: 'rgba(212,241,238,.90)', dark: 'rgba(203,234,232,.92)' },
    '--dsw-specific-sidebar-fill': { light: 'rgba(238,250,251,.97)', dark: 'rgba(232,246,247,.97)' },
    '--dsw-specific-sidebar-nav-item-active-accent': { light: 'rgba(232,127,155,.24)', dark: 'rgba(221,116,143,.26)' },
    '--dsw-specific-sidebar-nav-item-active': { light: 'rgba(217,243,240,.85)', dark: 'rgba(207,236,234,.87)' },
    '--dsw-specific-sidebar-nav-item-hover': { light: 'rgba(255,226,233,.48)', dark: 'rgba(250,217,226,.50)' },
    '--dsw-shadow-lv2': { light: '0 18px 44px rgba(45,91,91,.16),0 0 0 1px rgba(46,139,138,.16),0 7px 22px rgba(225,120,148,.08)', dark: '0 20px 48px rgba(41,82,82,.18),0 0 0 1px rgba(43,128,127,.18),0 8px 24px rgba(210,110,137,.09)' },
  },
  appearance: {
    backgroundUrl: '/skin-assets/dream-journey/background.png',
    backgroundPosition: 'center center',
    accent: '#2c8f94',
    glow: '#e6809b',
    fontFamily: '"LXGW WenKai Screen","霞鹜文楷 GB Screen","PingFang SC","Microsoft YaHei UI","Microsoft YaHei",sans-serif',
  },
}

/** Add this definition to the shared registry for exactly this plugin lifetime. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.skinRuntime.register(pack), 'skin-dream-journey: client definition')
}
