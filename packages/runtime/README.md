# dsh-skin-runtime

`dsh-skin-runtime` 是 DSH 皮肤平台的运行时与管理界面插件。它负责发现已安装皮肤、切换当前皮肤、保存每个皮肤各自的本机背景，并向设置页提供皮肤管理入口。

当前正式兼容组合为 `dsh-skin-runtime@0.1.1`、`dsh-skin-void-whisper@0.1.1` 和 `dsh-skin-dream-journey@0.1.1`。两个皮肤包都精确依赖同版本运行时，安装或更新时应保持版本一致。

## 安装与更新

本包必须作为配置档案的直接插件安装，不能只依赖皮肤包的传递依赖，否则运行时设置页不会挂载。

正式配置档案建议一次安装同一版本的运行时和皮肤包：

```powershell
$SkinRepo = 'D:\deepseek\dsh-skin-platform'
$HarnessRepo = 'D:\deepseek\deepseek-harness-master'
$Version = '0.1.1'

Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location $HarnessRepo
pnpm.cmd dsh plugin --profile web add `
  "$SkinRepo\artifacts\dsh-skin-runtime-$Version.tgz" `
  "$SkinRepo\artifacts\dsh-skin-void-whisper-$Version.tgz" `
  "$SkinRepo\artifacts\dsh-skin-dream-journey-$Version.tgz"
```

安装或更新前先停止当前 Web 进程，命令完成后再重新启动。插件安装命令会修改配置档案，但不会让已经运行的进程自动重新组合插件。

更新时先在仓库内构建并执行 `pnpm.cmd run pack:all`，再用新版本号的三个 `.tgz` 重复上面的正式安装命令。打包脚本不会覆盖已经存在的同版本归档；需要重打包时应先提升包版本。

完整流程见[仓库使用说明](../../README.md)。

## 使用

1. 打开 Harness Web，进入“设置 → 皮肤”。
2. 在目标皮肤卡片中点击“使用此皮肤”；需要退出皮肤平台时选择“Harness 默认”。
3. 在“我的背景”中点击“选择图片”，上传当前皮肤专属的本机背景。
4. 上传后可调整填充方式、位置、图片强度、模糊和遮罩，也可点击“移除”恢复该皮肤的包内默认背景。
5. “环境动效”只控制皮肤装饰动画，不影响对话和工具执行。

用户背景按皮肤 ID 独立保存，不会在不同主题之间共用。默认位置为：

```text
<DSH_HOME>/skin-runtime/<skin-id>/user-background
```

图片只保存在 Harness 宿主配置目录中，不会写入皮肤包，也不会被提交到 Git 仓库。支持 PNG、JPEG、WebP、GIF 和 AVIF，单张图片上限为 25 MiB。

皮肤会声明固定外观方案：深色皮肤保持深色，浅色皮肤保持浅色，避免 Harness 自带外观选项覆盖皮肤配色。恢复“Harness 默认”后，外观控制权交还给 Harness。

## 卸载

卸载整个平台前，先在“设置 → 皮肤”切换到“Harness 默认”，再停止 Web 进程并执行：

```powershell
Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
Set-Location 'D:\deepseek\deepseek-harness-master'
pnpm.cmd dsh plugin --profile web remove `
  dsh-skin-dream-journey `
  dsh-skin-void-whisper `
  dsh-skin-runtime
```

不要在仍安装皮肤包时单独卸载运行时；皮肤包对运行时存在精确版本依赖。卸载插件默认保留配置档案中的本机背景文件，便于以后重新安装恢复。如果希望同时清除某张背景，应在卸载前进入对应皮肤并点击“移除”。

## 实现边界

- 每个 `SkinPack` 必须声明 `fixed-light`、`fixed-dark` 或 `adaptive`，停用皮肤时运行时会释放主题覆盖并恢复 Harness 官方外观。
- 运行时只使用官方主题令牌和稳定的 `data-slot` 标记，不依赖构建生成的 CSS 类名，也不替换 Harness 页面组件。
- Host 通过图片字节签名识别格式并限制请求大小；浏览器写入要求同源，SVG 不进入用户背景上传链路。
- 皮肤包只注册声明式数据和静态资源，不应复制设置页、背景存储、路由或 DOM 操作逻辑。
