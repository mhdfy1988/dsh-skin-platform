# DSH Skin Platform

DeepSeek Harness 的独立多包皮肤平台。它不修改官方 Harness 源码，通过共享运行时和独立皮肤包提供安装、切换、本机背景、更新、卸载及安全恢复能力。

当前推荐安装版本为 `0.1.1-rc.1`，适配 DeepSeek Harness `0.1.1-rc.2`，仅支持 Web 客户端。当前仓库没有发布 npm 包，安装来源是本仓库构建出的 tgz。

## 包组成

| 包 | 作用 | 是否必须直接安装 |
| --- | --- | --- |
| `dsh-skin-runtime` | 设置页、皮肤注册表、主题令牌、背景存储和静态资源服务 | 是 |
| `dsh-skin-void-whisper` | “虚空低语”固定深色皮肤 | 按需，但不能脱离运行时单独使用 |
| `dsh-skin-dream-journey` | “梦境仙游”固定浅色皮肤 | 按需，但不能脱离运行时单独使用 |

运行时和皮肤包必须是 Harness 配置档案的直接安装项。皮肤包的 peer 依赖只表达版本兼容，不能自动安装或激活运行时。推荐始终把同一版本组合中的三个包一起安装或更新。

## 环境要求

- Windows PowerShell；
- Node.js `^22.19.0` 或 `>=24`；
- pnpm `11.7.0`；
- DeepSeek Harness `0.1.1-rc.2`；
- Harness Web 配置档案名为 `web`。

下文使用两个本机路径变量，请按实际目录修改：

```powershell
$SkinRepo = 'D:\deepseek\dsh-skin-platform'
$HarnessRepo = 'D:\deepseek\deepseek-harness-master'
$Version = '0.1.1-rc.1'
```

默认正式 Harness home 是 `C:\Users\<用户名>\.dsh`。如果当前终端设置过测试用 `DSH_HOME`，正式安装前必须清除该临时覆盖，避免把包安装进隔离测试目录。

## 安装

### 1. 构建安装包

```powershell
Set-Location $SkinRepo
pnpm.cmd install
pnpm.cmd run typecheck
pnpm.cmd run test
pnpm.cmd run build
pnpm.cmd run pack:all
```

成功后，`artifacts` 目录应包含：

```text
dsh-skin-runtime-0.1.1-rc.1.tgz
dsh-skin-void-whisper-0.1.1-rc.1.tgz
dsh-skin-dream-journey-0.1.1-rc.1.tgz
```

`pack:all` 不会清空旧版本包，也拒绝覆盖已经存在的同版本 tgz。不要删除仍被 Harness 配置档案引用的旧 tgz；需要重新打包时应先提高包版本，并同步三个包的兼容版本。

### 2. 停止正在运行的 Harness Web

如果 Harness 在前台终端运行，按 `Ctrl+C` 停止。安装命令只更新配置档案，不会自动重组已经运行的 Web 进程。

### 3. 安装到正式 Web 配置档案

```powershell
Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location $HarnessRepo
pnpm.cmd dsh plugin --profile web add `
  "$SkinRepo\artifacts\dsh-skin-runtime-$Version.tgz" `
  "$SkinRepo\artifacts\dsh-skin-void-whisper-$Version.tgz" `
  "$SkinRepo\artifacts\dsh-skin-dream-journey-$Version.tgz"
```

命令成功后，正式配置文件 `C:\Users\<用户名>\.dsh\profiles\web\package.json` 的 `bundles` 和 `dependencies` 中应同时出现三个包。

### 4. 重新启动并验证

```powershell
Set-Location $HarnessRepo
pnpm.cmd dsh web --port 3080
```

打开 `http://127.0.0.1:3080/`，进入“设置 → 皮肤”。页面应列出“虚空低语”和“梦境仙游”，并显示与 `$Version` 一致的版本号。

## 使用

### 切换皮肤

1. 打开“设置 → 皮肤”。
2. 在皮肤卡片上点击“使用此皮肤”。
3. 页面立即切换背景、字体、主题令牌和装饰层；不需要重启。
4. 点击“Harness 默认 → 恢复默认”可释放全部皮肤覆盖，恢复官方外观。

当前皮肤选择和“环境动效”开关由 Host 保存。刷新页面或重新启动同一配置档案后仍会恢复。

### 为当前皮肤设置本机背景

1. 先切换到需要设置背景的皮肤。
2. 在“我的背景”区域点击“选择图片”。
3. 选择 PNG、JPEG、WebP、GIF 或 AVIF；单个文件最大 25 MiB。
4. 上传后可调整：显示背景、铺满或完整显示、背景位置、图片透明度、模糊和遮罩。
5. 点击“移除”只删除当前皮肤的本机背景；切换到其他皮肤不会共用这张图片或这些显示参数。

本机背景保存在 `<DSH_HOME>/skin-runtime/<skin-id>/user-background`，不会写入皮肤包、Git 仓库或 `settings.yaml`。关闭“显示背景”只隐藏图片并保留文件；点击“移除”才会删除当前皮肤的本机副本。

### 官方外观与皮肤的关系

- “虚空低语”是固定深色皮肤，不受官方浅色、深色或跟随系统选项影响。
- “梦境仙游”是固定浅色皮肤，不受官方外观选项影响。
- 选择“Harness 默认”后，皮肤运行时释放主题覆盖，官方外观选择立即重新生效。

## 更新

更新时不要用新内容覆盖旧版本 tgz，也不要只更新运行时而保留精确依赖旧运行时的皮肤包。

### 推荐更新流程

1. 停止正在运行的 Harness Web。
2. 拉取皮肤平台最新代码。
3. 查看三个 `package.json`，确认运行时和两个皮肤包属于同一个兼容版本组合。
4. 运行 typecheck、测试、构建和 `pack:all`。
5. 对三个新 tgz 再执行一次 `dsh plugin add`。
6. 重新启动 Harness Web，并在“设置 → 皮肤”核对版本。

```powershell
Set-Location $SkinRepo
git pull --ff-only
pnpm.cmd install
pnpm.cmd run typecheck
pnpm.cmd run test
pnpm.cmd run build
pnpm.cmd run pack:all

Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location $HarnessRepo
pnpm.cmd dsh plugin --profile web add `
  "$SkinRepo\artifacts\dsh-skin-runtime-$Version.tgz" `
  "$SkinRepo\artifacts\dsh-skin-void-whisper-$Version.tgz" `
  "$SkinRepo\artifacts\dsh-skin-dream-journey-$Version.tgz"

pnpm.cmd dsh web --port 3080
```

执行更新前要把 `$Version` 改成新版本。若 `pack:all` 提示目标 tgz 已存在，说明版本号没有变化或该版本已经打过包；应使用现有的可信产物，或提高版本后重新构建，不能覆盖原文件。

## 卸载

插件卸载同样需要先停止 Web，执行命令后再启动。只从配置档案移除包不会自动删除每套皮肤的本机背景数据。

### 卸载一个皮肤

建议先在“设置 → 皮肤”切换到另一个皮肤或“Harness 默认”，再停止 Web 并执行：

```powershell
Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location $HarnessRepo
pnpm.cmd dsh plugin --profile web remove dsh-skin-dream-journey
pnpm.cmd dsh web --port 3080
```

卸载“虚空低语”时把包名替换为 `dsh-skin-void-whisper`。如果直接卸载当前正在使用的皮肤，重启后运行时会恢复官方默认并显示缺失皮肤诊断；保存的皮肤 ID 暂时保留，重新安装同 ID 兼容包并重启后可自动恢复。

### 卸载整个平台

先在设置页选择“Harness 默认”，停止 Web，然后一次移除两个皮肤和运行时：

```powershell
Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location $HarnessRepo
pnpm.cmd dsh plugin --profile web remove `
  dsh-skin-dream-journey `
  dsh-skin-void-whisper `
  dsh-skin-runtime
pnpm.cmd dsh web --port 3080
```

不要在仍安装皮肤包时单独卸载 `dsh-skin-runtime`。若希望同时清理本机背景，应在卸载前分别切换到每套皮肤并点击“移除”；插件卸载默认保留这些 profile-local 数据，便于重新安装后恢复。

## 常见问题

### 设置中没有“皮肤”入口

确认 `dsh-skin-runtime` 已作为 `web` 配置档案的直接 bundle 安装，并确认安装后已经重启 Web。只安装皮肤包不会自动激活运行时。

### 更新后仍显示旧版本

检查 `<DSH_HOME>/profiles/web/package.json` 是否指向新的 tgz 文件名，然后彻底停止并重新启动对应 Web 实例。同文件名、同版本号覆盖内容无法作为可靠更新方式。

### 切换皮肤后背景还是上一套图片

`0.1.1-rc.1` 起，本机背景和显示参数按皮肤 ID 独立保存。确认运行时和两个皮肤包均已更新到同一个兼容版本，并完成重启。

### 卸载后出现缺失皮肤诊断

这是保留选择、支持重新安装恢复的预期行为。可以重新安装同 ID 兼容包，或在设置页选择“Harness 默认”清除保存的皮肤选择。

## 开发与验证

```powershell
pnpm.cmd run typecheck
pnpm.cmd run test
pnpm.cmd run build
pnpm.cmd run pack:all
```

自动化覆盖声明式清单、固定颜色策略、主题令牌、原生控件、每皮肤背景存储、图片格式校验、注册生命周期、tgz 保留规则及运行时交互。`pack:all` 只用于生成新版本产物，不是清理 artifacts 的命令。

## 当前边界

- 仅支持 Web，不支持 Electron `file://` 资源链路。
- 每个配置档案中的每套皮肤只保存一张本机背景，没有壁纸库、云同步或市场。
- 不替换 Harness 的 root、sidebar、conversation 或 details 实现。
- 不依赖 Harness 构建生成的哈希类名。
- 内置素材为原创抽象素材，不包含游戏 IP 角色、标识或原画。

后续皮肤应继续依赖 `dsh-skin-runtime` 的声明式协议，不复制设置页、路由、背景存储或 DOM 操作逻辑。
