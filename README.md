# DSH 扩展口袋与插件配置

> DeepSeek Harness 的非官方社区插件。本目录可作为独立 GitHub 仓库的根目录。

`dsh-plugin-hub` 是独立的 DeepSeek Harness 插件，在输入框旁提供方框加号扩展入口，在设置侧栏提供带搜索的“插件配置”。插件通过显式注册选择加入，不自动吞并所有第三方页面。

视频/GIF 抽帧功能由独立的 `dsh-media-reader` 插件提供，本包提供统一入口与设置收纳基础设施。

搜索用于匹配页面名称和注册关键字，不是对原设置页面中每个字段进行全文搜索。已收纳的启动动画、聊天背景继续使用原页面的保存逻辑。

## 用户安装

发布 ZIP 包含预构建 `plugin/`、UTF-8 `使用说明.txt` 和三个 ASCII CMD 启动器。解压后完全退出 DSH，双击 `检查环境.cmd` 检查，再双击 `安装.cmd`。重启后检查方框加号和“插件配置”。卸载使用同包的 `卸载.cmd`。

安装器使用目标 DSH 自带 CLI，将插件复制至 `<DSH_HOME>/custom-plugins/dsh-plugin-hub/<profile>` 后离线注册 `link:`，不会依赖下载解压目录或原机器盘符。默认 profile 为 `desktop`，默认 DSH_HOME 为当前用户 `.dsh`，支持通过脚本参数指定自定义位置。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\portable.ps1 -Mode Check -DshPath "D:\Apps\DeepSeek Harness" -DshHome "D:\DSH Data" -Profile desktop
```

把 `Check` 改成 `Install` 或 `Uninstall` 执行对应操作。`Check` 只读，不创建目录或启动 DSH。安装、卸载在 DSH 正运行时会停止并说明原因，不自动关闭进程。正式支持的 DSH 版本范围以包清单为准。

## 安装事务与恢复

仅修改本插件的依赖与 bundle 注册；原有个人 patch、其他插件注册以及其他 profile 不应改变。操作前备份本 profile 的包清单、锁文件、工作区声明、patch、兼容例外文件及本插件旧版本。失败时恢复本次事务，不会联网兜底。

备份保存在 `<DSH_HOME>/backups/dsh-plugin-hub/`。卸载按当下配置移除本插件，不能把安装时的整份旧清单恢复回去，以免抹掉用户后来添加的其他插件。凭据、会话和媒体数据不属于插件包或事务备份。

## 后续扩展如何接入

扩展的 `package.json` 在客户端依赖中声明本插件，确保客户端模块加载顺序：

```json
{
  "dsh": {
    "client": {
      "platform": "web",
      "inject": ["dsh-plugin-hub"]
    }
  }
}
```

本插件通过 `ctx.reflect.provide('pluginHub', hub)` 提供客户端服务。扩展客户端自己的 Cordis 插件声明 `inject: ['pluginHub']`，在挂载时注册动作和设置页：

```js
export const inject = ['pluginHub'];

export function apply(ctx) {
  ctx.effect(() => ctx.pluginHub.registerAction({
    id: 'media-reader:open',
    label: '视频/GIF',
    description: '从原始媒体导入并抽帧',
    order: 10,
    when(context) {
      return true; // 是否在当前会话上下文显示
    },
    enabled(context) {
      return true; // 显示后是否允许执行
    },
    async run({ sessionId, session, inputActions, signal, closeMenu, ...nativeSessionProps }) {
      // 导入界面和后续读取逻辑由功能扩展自身实现。
      // 可调用 closeMenu() 关闭口袋；异步任务应响应 signal。
      await openMediaImportDialog({
        sessionId, session, inputActions, signal, closeMenu, ...nativeSessionProps,
      });
    },
  }));

  ctx.effect(() => ctx.pluginHub.registerSettings({
    id: 'media-reader',
    label: '视频/GIF',
    description: '抽帧与读取选项',
    keywords: ['视频', 'GIF'],
    order: 30,
  }, SettingsPanel));
}
```

上述代码作为扩展客户端源码，通过该扩展的 DSH 客户端构建流程发布。`openMediaImportDialog` 和 `SettingsPanel` 由功能扩展自行提供；这里不实现视频读取。`order` 控制顺序，`when(context)` 控制可见性，`enabled(context)` 控制是否可执行。原生会话属性随 DSH 版本提供，扩展应检查所需能力是否存在。

`registerAction()` 与 `registerSettings()` 都返回幂等的注销函数，必须由贡献者自己的 `ctx.effect` 持有。这样扩展被关闭、卸载或热重载后，动作和页面会随之注销，避免留下重复入口。动作 ID、设置页 ID 应使用插件专属前缀或唯一名称，设置由贡献者自行读取、保存；配置中心只负责收纳和定位。

## 维护与打包

`tools/test-portable.ps1` 用隔离夹具和假 CLI 验证中文空格路径、只读检查、安装、升级、卸载和失败回滚，不安装真实 profile。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\test-portable.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\test-package.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\package.ps1
```

打包默认输出到 本项目的 `dist/` 目录（可用 `-OutputDirectory` 指定其他位置），不会覆盖同名既有 ZIP。打包前插件入口必须已构建，且没有需从 npm 下载的第三方运行依赖。脚本整理清单内文件、写入逐文件校验值，验证 ZIP 条目后输出压缩包 SHA-256。在干净目标机上离线安装仍需作为版本发布验收，隔离夹具测试不代替真实机器兼容性验证。

## 开源目录与开发环境

本目录包含可以维护的完整 JavaScript 插件源码。`lib/*.js` 就是现有源码，无需反编译或另找 `src/`；浏览器客户端由 DSH 模块加载器直接加载。插件没有需要从 npm 下载的运行依赖。

- `lib/`：插件源码；`test/`：测试及隔离夹具。
- `delivery/`：发布包用的使用说明和安装/卸载/检查启动器。
- `tools/`：离线安装器、打包器和事务/打包测试。
- `LICENSE`：保留原有 MIT 版权声明；第三方文件保留各自许可证。
- `.gitignore`：忽略测试产物、个人环境配置和发布包；`.gitattributes`：约定文本换行。

开发测试使用 Windows、Node.js 22 或以上、Windows PowerShell 5.1。运行插件只需 README 指定版本的 DSH，不能在普通浏览器直接执行客户端文件。

安装器和打包测试的夹具默认放在系统临时目录并在成功后清理。如 Windows 报路径过长，可将环境变量 `DSH_TEST_TEMP` 设置为较短的可写临时目录，再执行测试；不会改变实际插件的安装位置。

打包默认输出 `dist/`，也可用 `-OutputDirectory` 指定目录。打包器拒绝覆盖同名 ZIP。新改动发布前请更新版本，并重新构建发布 ZIP 与校验文件。

### 可选的真实 DSH 浏览器测试

`test/browser.test.mjs` 使用你自己安装的 DSH 的 React、Cordis 和渲染器；这些第三方应用文件不在源码仓库中。它启动独立无头 Chrome 和临时 profile，不读取真实聊天或账号配置。输出到 `test/artifacts/`。

`DSH_TEST_ASAR` 可指定 DSH 0.2.1-rc.2 的 `resources/app.asar`；不设置时仅尝试当前用户标准安装目录。`DSH_TEST_CHROME` 可指定 Chrome 可执行文件；默认尝试 `C:/Program Files/Google/Chrome/Application/chrome.exe`。

`npm run test:browser` 运行这组可选集成测试。找不到测试环境会明确报错，不会伪装成测试通过。
