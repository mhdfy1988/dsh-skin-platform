# dsh-skin-void-whisper

`dsh-skin-void-whisper` 是 DSH 皮肤平台的深色虚空主题包，提供紫蓝黑配色、边框与选中状态、对话输入框、轨迹视图和设置页适配。它使用原创抽象 SVG，不包含游戏角色、标识或原画。当前正式版本为 `0.1.1`，精确依赖 `dsh-skin-runtime@0.1.1`。

## 安装与更新

通常应按[仓库使用说明](../../README.md)一次安装或更新运行时与全部皮肤。若同版本运行时已经直接安装到正式 `web` 配置档案，也可以只安装本皮肤包：

```powershell
$SkinRepo = 'D:\deepseek\dsh-skin-platform'
$Version = '0.1.1'

Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location 'D:\deepseek\deepseek-harness-master'
pnpm.cmd dsh plugin --profile web add "$SkinRepo\artifacts\dsh-skin-void-whisper-$Version.tgz"
```

安装或更新前先停止 Harness Web，命令完成后再启动正式实例。不要用同一个版本号覆盖已有归档；更新包内容时应提升版本并安装新的 `.tgz`。

## 使用

1. 打开“设置 → 皮肤”。
2. 找到“虚空低语”并点击“使用此皮肤”。
3. 如需自选背景，在“我的背景”中点击“选择图片”；该图片只属于本皮肤，不会同步到其他主题。
4. 可调整填充、位置、图片强度、模糊和遮罩；点击“移除”可恢复包内默认背景。

本皮肤固定使用深色方案。切换到“Harness 默认”后，Harness 自带外观设置会重新生效。

## 卸载

先切换到“Harness 默认”或其他已安装皮肤，停止 Web 进程，然后执行：

```powershell
Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location 'D:\deepseek\deepseek-harness-master'
pnpm.cmd dsh plugin --profile web remove dsh-skin-void-whisper
```

重新启动 Harness Web 后卸载生效。本机自选背景默认保留；如需同时清除，请在卸载前进入本皮肤并点击“移除”。
