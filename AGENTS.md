# DSH Skin Platform implementation rules

1. This repository is an external multi-package project. Treat the DeepSeek Harness checkout as read-only reference material: never edit, patch, vendor-rewrite or require a fork of official Harness source to implement or repair a skin.
2. `dsh-skin-runtime` owns selection, settings, theme-token application, body attributes, overlay rendering and `/skin-assets`.
3. A `dsh-skin-*` package registers declarative assets and one `SkinPack`; it must not create another settings page or mutate Harness DOM.
4. Install the runtime and every skin package as direct profile dependencies. `dsh.client.inject` is informational and does not sequence Client activation.
5. Cordis `inject` values are service names. The Host runtime waits for `webServer`; Host skin packages wait for `skinAssets`; Client skin packages wait for `skinRuntime`.
6. Every registration returns or owns a disposer. Duplicate skin ids, duplicate asset paths and unsupported API versions fail loud.
7. Keep all asset paths on the explicit Host allowlist. Do not turn request paths into filesystem paths.
8. Keep version 1 Web-only. Electron assets require a separate adapter and must not silently fall back to the browser route.
9. Do not register `root`, `sidebar`, `conversation` or `details` for ordinary skins. Use official theme tokens and the runtime's `shell.overlay` contribution.
10. `dsh plugin add/remove` changes the next boot composition; restart the Web instance before judging an installed-package change.
11. Public skins use original or licensed assets and names. Do not package game artwork or imply affiliation with a game publisher.
12. Before packaging, run `pnpm.cmd run typecheck`, `pnpm.cmd run test`, `pnpm.cmd run build` and `pnpm.cmd run pack:all`.
13. A user-selected background is profile-local data at `<DSH_HOME>/skin-runtime/<skin-id>/user-background`; never copy it into a skin package or publish it with an artifact.
14. Background uploads stay on the runtime's same-origin route, use byte-signature validation and remain size-bounded. Do not accept SVG or trust a filename, extension or request Content-Type.
15. Never overwrite a published or installed tgz and expect `dsh plugin add` to refresh the profile. Increment the prerelease version, rebuild a distinct artifact and update every package in the compatible set.
16. Evaluate user-background readability with the compounded opacity of every full-viewport surface, not one token in isolation. Keep `--dsw-alias-bg-base` translucent for image-led skins and use separate, more opaque sidebar, composer and menu tokens where controls need contrast.
17. Resolve official Appearance and skin color-mode conflicts inside `dsh-skin-runtime` and the declarative `SkinPack` contract. Do not hide or patch the official Appearance UI, target generated class names, or mutate official component behavior.
18. Do not use `Alt+ArrowDown` to validate native selects in the in-app browser; the chord can trigger application-level behavior. Verify the select and option computed colors, then use a manual OS-level screenshot when the open native popup itself needs visual acceptance.
19. Background range controls preview locally during pointer or keyboard movement and persist only the final gesture value. While a preview or write is pending, Host snapshots must not replace the optimistic visual state.
20. Theme official controls through stable semantic state attributes such as `aria-current`, `aria-pressed` and `aria-selected`; generated Harness class names remain forbidden. Selection styling should combine a thin accent border, a low-opacity fill and readable text instead of a solid white badge or panel.
21. Unregistering a selected skin releases its visual effects but preserves the durable skin id. Re-registering the same id during an update must reactivate it; only an explicit user selection may persist `none`.
