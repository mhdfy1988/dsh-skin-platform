# DSH Skin Platform

DeepSeek Harness 的独立多包皮肤平台。它不修改官方 Harness 源码，通过一个共享运行时和多个独立皮肤包实现安装、切换、持久化、更新和卸载后的安全恢复。

当前正式版本：`0.1.0`，适配 DeepSeek Harness `0.1.1-rc.2`，仅支持 Web 客户端。

## 当前包含

| 包 | 作用 |
| --- | --- |
| `dsh-skin-runtime` | Host 设置、用户背景与静态资源服务，Client 皮肤注册表、设置页、主题 token 和全局装饰层 |
| `dsh-skin-void-whisper` | “虚空低语”蓝黑工作面、冷紫秘仪边线与电光选中风格皮肤 |

皮肤包只注册声明式数据和自己的 SVG 资源，不直接查找或修改 Harness 内部 DOM。

## 已实现能力

- “设置 → 皮肤”独立页面；
- 多个已安装皮肤的统一目录和预览；
- 本机图片选择、预览、显示开关、填充、位置、透明度、模糊和遮罩；
- 用户背景固定保存在当前 `<DSH_HOME>/skin-runtime/user-background`，不进入设置文件或皮肤安装包；
- 官方主题 token 的可撤销覆盖；
- 皮肤可声明固定浅色、固定深色或自适应策略；固定模式不受官方外观选择影响，停用后立即恢复官方选择；
- 每个皮肤独立背景图、字体、配色和非交互浮层；
- `skin-runtime` Host 设置命名空间持久化当前选择与动效开关；
- `/skin-assets/<skin-id>/<asset>` 统一静态资源路由；
- `/skin-assets/user/background` 同源上传、读取和移除；
- 资源清单白名单、GET/HEAD 限制和目录穿越拒绝；
- 用户背景的 25 MiB 限制、图片字节签名校验和跨来源写入拒绝；
- 缺失的已保存皮肤不激活，界面恢复官方默认并显示诊断；
- 重新安装缺失皮肤并重启后，已保存选择自动恢复。

## 安装正式包

先构建和生成两个 tgz：

```powershell
cd D:\deepseek\dsh-skin-platform
pnpm.cmd install
pnpm.cmd run typecheck
pnpm.cmd run test
pnpm.cmd run pack:all
```

安装到 Harness Web 配置档案：

```powershell
cd D:\deepseek\deepseek-harness-master
pnpm.cmd dsh plugin --profile web add `
  D:\deepseek\dsh-skin-platform\artifacts\dsh-skin-runtime-0.1.0.tgz `
  D:\deepseek\dsh-skin-platform\artifacts\dsh-skin-void-whisper-0.1.0.tgz
```

管理器和皮肤包都必须是配置档案的直接安装项。皮肤包的 peer 依赖只表达版本兼容，不能自动激活管理器。

## 更新和卸载

更新或重新安装单个皮肤包：

```powershell
pnpm.cmd dsh plugin --profile web add <新的皮肤包.tgz>
```

更新必须生成新版本号的 tgz。不要覆盖同版本文件后再次安装：pnpm 可能继续使用配置档案中的旧缓存，无法据此判断真实更新是否生效。

卸载单个皮肤包：

```powershell
pnpm.cmd dsh plugin --profile web remove dsh-skin-void-whisper
```

当前 Harness 不会因为 `dsh plugin add/remove` 自动重组正在运行的组合包层。安装、更新或卸载后需要重启对应 Web 实例。活动皮肤被卸载并重启后：

1. 背景、token 和浮层不会继续加载；
2. 页面使用官方默认外观；
3. 设置页显示缺失皮肤诊断；
4. 保存的选择暂时保留，重新安装兼容包后可自动恢复，也可以手动选择“Harness 默认”清除。

## 开发命令

```powershell
pnpm.cmd run typecheck
pnpm.cmd run test
pnpm.cmd run build
pnpm.cmd run pack:all
```

当前自动化覆盖声明式清单、固定颜色策略、light/dark token 成对值、稳定插槽着色、组合包声明、服务名注入、SVG 无脚本内容、图片格式识别、有界读取和本机文件生命周期。

## 已验证的真实链路

- 两个 tgz 同时安装到隔离 Web profile；
- Host 和 Client 两个包全部激活；
- “虚空低语”SVG 资源返回 `200 image/svg+xml`；
- 目录穿越请求返回 404；
- 设置页列出“虚空低语”皮肤；
- 本机 PNG 上传后可预览并覆盖工作区背景；
- 填充、位置和显示开关生效，刷新后 Host 持久化仍保留；
- 背景读取返回 `200 image/png`，错误来源写入返回 403，非图片返回 415；
- 虚空低语和官方默认可互相切换，固定深色策略在官方浅色、深色与跟随系统状态下保持一致；
- 刷新页面后 Host 持久化选择仍生效；
- 卸载活动皮肤并重启后安全恢复；
- 重新安装并重启后恢复保存的皮肤；
- 皮肤模块没有浏览器控制台 error/warn。

隔离验证目录为 `.test-home`，已被 Git 忽略。

## 第一版边界

- 仅支持 Web，不支持 Electron `file://` 资源链路；
- 用户背景仅支持当前 Web 配置档案的单张本机图片，没有壁纸库、同步、导入导出或市场；
- 不替换 `root`、`sidebar`、`conversation`、`details`；
- 不提供依赖官方哈希类名的组件级补丁；
- 内置皮肤使用原创抽象素材，不包含游戏 IP 资源。

后续正式皮肤应继续依赖 `dsh-skin-runtime` 的声明式协议，而不是复制设置页、路由或 DOM 操作逻辑。
