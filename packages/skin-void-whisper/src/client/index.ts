/** Client registration for the Void Whisper skin. */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SkinPack } from 'dsh-skin-runtime/client'
import type {} from 'dsh-skin-runtime/client'

export const inject = ['skinRuntime']

/** Declarative void-artifact palette; the package performs no direct DOM mutation. */
export const pack: SkinPack = {
  apiVersion: 2,
  id: 'void-whisper',
  name: '虚空低语',
  description: '蓝黑虚空工作面、冷紫秘仪边线与克制的电光选中状态。',
  version: '0.1.1-rc.1',
  dshRange: '0.1.1-rc.2',
  colorScheme: 'fixed-dark',
  previewUrl: '/skin-assets/void-whisper/background.svg',
  tokens: {
    '--dsw-alias-bg-base': { light: 'rgba(5,9,24,.24)', dark: 'rgba(3,6,18,.30)' },
    '--dsw-alias-bg-layer-1': { light: 'rgba(8,13,33,.78)', dark: 'rgba(5,9,25,.84)' },
    '--dsw-alias-bg-layer-2': { light: 'rgba(13,19,45,.84)', dark: 'rgba(8,13,34,.89)' },
    '--dsw-alias-bg-layer-3': { light: 'rgba(19,26,58,.94)', dark: 'rgba(12,18,45,.97)' },
    '--dsw-alias-bg-overlay': { light: 'rgba(6,10,27,.96)', dark: 'rgba(3,6,19,.98)' },
    '--dsw-alias-bg-module-platform': { light: 'rgba(12,18,43,.93)', dark: 'rgba(7,12,31,.96)' },
    '--dsw-alias-border-l1': { light: 'rgba(145,120,232,.14)', dark: 'rgba(154,128,242,.14)' },
    '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(153,126,247,.22)', dark: 'rgba(162,136,255,.21)' },
    '--dsw-alias-border-l2': { light: 'rgba(157,128,249,.29)', dark: 'rgba(167,142,255,.28)' },
    '--dsw-alias-border-l3': { light: 'rgba(165,136,255,.43)', dark: 'rgba(177,151,255,.42)' },
    '--dsw-alias-border-l4': { light: 'rgba(184,159,255,.61)', dark: 'rgba(197,174,255,.59)' },
    '--dsw-alias-brand-primary': { light: '#815fe8', dark: '#9877f5' },
    '--dsw-alias-brand-text': { light: '#aa96f6', dark: '#beaaff' },
    '--dsw-alias-label-primary': { light: '#e7e9f3', dark: '#eef0f8' },
    '--dsw-alias-label-primary-foreground': { light: '#ffffff', dark: '#ffffff' },
    '--dsw-alias-label-secondary': { light: '#adb3c5', dark: '#bec3d3' },
    '--dsw-alias-label-tertiary': { light: '#7e879e', dark: '#959caf' },
    '--dsw-alias-label-caption': { light: '#68738d', dark: '#7c859e' },
    '--dsw-alias-markdown-code-block': { light: 'rgba(7,11,29,.96)', dark: 'rgba(4,8,22,.98)' },
    '--dsw-alias-markdown-code-block-banner': { light: 'rgba(16,22,49,.98)', dark: 'rgba(9,14,35,.99)' },
    '--dsw-alias-button-primary-fill': { light: '#5631bd', dark: '#6843cf' },
    '--dsw-alias-button-primary-hover': { light: '#6842d2', dark: '#7a55e3' },
    '--dsw-alias-button-info-fill': { light: '#6941ce', dark: '#7957dc' },
    '--dsw-alias-button-info-hover': { light: '#7b53de', dark: '#8c6aec' },
    '--dsw-alias-button-elevated-fill': { light: 'rgba(13,19,45,.93)', dark: 'rgba(8,13,33,.96)' },
    '--dsw-alias-button-floating-fill': { light: 'rgba(18,25,56,.93)', dark: 'rgba(11,17,41,.96)' },
    '--dsw-alias-button-floating-hover': { light: 'rgba(91,67,178,.41)', dark: 'rgba(107,80,202,.43)' },
    '--dsw-alias-button-ghost-active-border': { light: '#896be6', dark: '#a183f8' },
    '--dsw-alias-button-ghost-active-fill': { light: 'rgba(91,63,180,.24)', dark: 'rgba(108,78,205,.27)' },
    '--dsw-alias-button-ghost-active-hover': { light: 'rgba(108,77,204,.31)', dark: 'rgba(124,92,224,.34)' },
    '--dsw-alias-interactive-bg-active': { light: 'rgba(91,67,188,.20)', dark: 'rgba(109,82,211,.22)' },
    '--dsw-alias-interactive-bg-hover': { light: 'rgba(111,94,205,.12)', dark: 'rgba(128,109,225,.14)' },
    '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(101,75,205,.22)', dark: 'rgba(118,91,226,.24)' },
    '--dsw-alias-interactive-bg-hover-solid': { light: 'rgba(40,34,96,.76)', dark: 'rgba(35,29,88,.83)' },
    '--dsw-alias-state-business-primary': { light: '#8067df', dark: '#977df2' },
    '--dsw-alias-state-business-tertiary': { light: 'rgba(128,103,223,.17)', dark: 'rgba(151,125,242,.19)' },
    '--dsw-alias-state-error-primary': { light: '#d4727f', dark: '#df7d89' },
    '--dsw-alias-state-success-primary': { light: '#66afa5', dark: '#72bbb0' },
    '--dsw-alias-state-warn-label': { light: '#b9975b', dark: '#c5a260' },
    '--dsw-alias-scrollbar-bg-l1': { light: 'rgba(112,121,202,.26)', dark: 'rgba(124,133,218,.25)' },
    '--dsw-alias-scrollbar-bg-l2': { light: 'rgba(136,145,222,.31)', dark: 'rgba(147,156,232,.30)' },
    '--dsw-alias-scrollbar-hover-l1': { light: 'rgba(151,160,230,.44)', dark: 'rgba(163,172,241,.43)' },
    '--dsw-alias-scrollbar-hover-l2': { light: 'rgba(180,187,241,.50)', dark: 'rgba(191,198,249,.48)' },
    '--dsw-specific-bubble': { light: 'rgba(50,38,105,.82)', dark: 'rgba(43,31,94,.87)' },
    '--dsw-specific-input-major': { light: 'rgba(7,12,31,.87)', dark: 'rgba(5,9,24,.92)' },
    '--dsw-specific-menu': { light: 'rgba(9,14,35,.96)', dark: 'rgba(5,9,25,.98)' },
    '--dsw-specific-selector': { light: 'rgba(91,69,181,.29)', dark: 'rgba(106,81,204,.33)' },
    '--dsw-specific-sidebar-fill': { light: 'rgba(2,5,15,.95)', dark: 'rgba(1,3,11,.97)' },
    '--dsw-specific-sidebar-nav-item-active-accent': { light: 'rgba(104,76,210,.31)', dark: 'rgba(120,91,231,.34)' },
    '--dsw-specific-sidebar-nav-item-active': { light: 'rgba(36,32,91,.50)', dark: 'rgba(31,27,82,.55)' },
    '--dsw-specific-sidebar-nav-item-hover': { light: 'rgba(54,48,119,.25)', dark: 'rgba(63,55,138,.28)' },
    '--dsw-shadow-lv2': { light: '0 22px 64px rgba(0,2,14,.52),0 0 0 1px rgba(150,121,241,.12),0 0 34px rgba(111,75,225,.09)', dark: '0 24px 72px rgba(0,0,10,.62),0 0 0 1px rgba(166,138,255,.13),0 0 42px rgba(124,87,239,.11)' },
  },
  appearance: {
    backgroundUrl: '/skin-assets/void-whisper/background.svg',
    backgroundPosition: 'center center',
    accent: '#9b7cff',
    glow: '#754cff',
    fontFamily: '"Palatino Linotype","Book Antiqua","Iowan Old Style",serif',
  },
}

/** Add this definition to the shared registry for exactly this plugin lifetime. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.skinRuntime.register(pack), 'skin-void-whisper: client definition')
}
