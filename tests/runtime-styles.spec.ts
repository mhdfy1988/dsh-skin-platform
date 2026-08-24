import { describe, expect, it } from 'vitest'
import { SKIN_RUNTIME_CSS } from '../packages/runtime/src/client/styles.ts'

describe('skin runtime semantic surface styles', () => {
  it('themes Harness disclosure, trajectory and detail surfaces through stable markers', () => {
    expect(SKIN_RUNTIME_CSS).toContain('[data-context-injection-body]')
    expect(SKIN_RUNTIME_CSS).toContain('[data-role-kind="context"]')
    expect(SKIN_RUNTIME_CSS).toContain('[data-role-kind="system"]')
    expect(SKIN_RUNTIME_CSS).toContain('[data-role-kind="user"]')
    expect(SKIN_RUNTIME_CSS).toContain('#trajectory-detail-panel :is(p,li)>code')
    expect(SKIN_RUNTIME_CSS).toContain('[data-slot="conversation.chat.node"] :not(pre)>code')
    expect(SKIN_RUNTIME_CSS).toContain('[data-slot="conversation.chat.node"] pre')
    expect(SKIN_RUNTIME_CSS).toContain('[data-slot="tool.call.toolview"]')
  })

  it('themes the native background-position control without generated Harness classes', () => {
    expect(SKIN_RUNTIME_CSS).toContain('.dsp-control-select option')
    expect(SKIN_RUNTIME_CSS).toContain('color-scheme:inherit')
    expect(SKIN_RUNTIME_CSS).toContain('background:var(--dsw-specific-menu)')
    expect(SKIN_RUNTIME_CSS).toContain('button[aria-pressed="true"][disabled]')
    expect(SKIN_RUNTIME_CSS).not.toMatch(/\.[A-Za-z]{6}_[A-Za-z]/)
  })

  it('uses the active skin scheme for background veils and depth', () => {
    expect(SKIN_RUNTIME_CSS).toContain('[data-dsh-skin-color-scheme="fixed-light"]')
    expect(SKIN_RUNTIME_CSS).toContain('--dsp-custom-background-shade-rgb:255 253 248')
    expect(SKIN_RUNTIME_CSS).toContain('rgb(var(--dsp-custom-background-shade-rgb) / var(--dsp-custom-background-shade))')
    expect(SKIN_RUNTIME_CSS).toContain('var(--dsw-shadow-lv2')
    expect(SKIN_RUNTIME_CSS).toContain('var(--dsp-skin-shadow-soft)')
    expect(SKIN_RUNTIME_CSS).toContain('var(--dsp-skin-shadow-medium)')
  })

  it('uses semantic selection states for the restrained violet interaction language', () => {
    expect(SKIN_RUNTIME_CSS).toContain('nav button[aria-current="true"]')
    expect(SKIN_RUNTIME_CSS).toContain('button[aria-pressed="true"]')
    expect(SKIN_RUNTIME_CSS).toContain('div[aria-selected="true"]')
    expect(SKIN_RUNTIME_CSS).toContain('backdrop-filter:blur(24px)')
  })

  it('carries the same visual language through composer, menus and error status', () => {
    expect(SKIN_RUNTIME_CSS).toContain('[data-composer-card]')
    expect(SKIN_RUNTIME_CSS).toContain('button[aria-haspopup="menu"]')
    expect(SKIN_RUNTIME_CSS).toContain('[role="menu"] button[role="menuitem"]:has(>svg)')
    expect(SKIN_RUNTIME_CSS).toContain('[data-chat-flow-kind="turn-error"] [role="status"]>code')
    expect(SKIN_RUNTIME_CSS).toContain('var(--ds-font-family-code')
    expect(SKIN_RUNTIME_CSS).toContain('button[aria-pressed="true"]:not(:disabled):after')
  })
})
