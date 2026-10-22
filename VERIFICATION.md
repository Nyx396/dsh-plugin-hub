# 开源目录验证记录

验证日期：2026-10-22。插件版本：1.0.0。

验证使用本目录的隔离副本；未安装或卸载真实 DSH 插件，未修改个人 profile、账号或会话。原有 F 盘 Release ZIP 和校验文件保留不变。

| 检查 | 结果 |
| --- | --- |
| `tools/test-portable.ps1` | 10 组通过：只读检查、中文空格路径、离线安装、失败回滚、升级幂等、对象键顺序、数组顺序保护、卸载保留后来配置、越界拒绝、运行中拒绝 |
| `tools/test-package.ps1` | 通过：默认源码根定位、UTF-8 说明、ASCII/CRLF 启动器、标准 ZIP 路径、逐文件哈希、拒绝覆盖 |
| `tools/package.ps1` | 在隔离副本中实际生成完整 ZIP 与 SHA-256 文件，默认输出到 dist/ |
| 运行源码与原发布 ZIP 比对 | lib/index.js、lib/client.js、cordis.patch.yml 的 SHA-256 完全一致 |
| 上传检查 | 无个人安装记录、用户名绝对路径、常见格式密钥；无超过 GitHub 网页 25 MiB 限制的单文件 |

测试环境使用 Windows PowerShell 5.1、Node.js 24。测试夹具通过 `DSH_TEST_TEMP` 使用较短的临时目录，避免 Windows 旧路径长度限制；路径穿越和清理边界检查仍然保留。

已修正原测试夹具中修复子进程的引号传递方式，避免 PowerShell 参数解析错误冒充预期的模拟失败。生产插件 lib/ 与安装器 portable.ps1 未改变。

可选的真实 DSH 浏览器测试本次未完成：本机无头 Chrome 在启动阶段因 Crashpad 管道错误退出。测试文件已保留并改为可配置的测试路径；不能将本记录当作真实浏览器 UI 验收通过。

原始便携包 SHA-256：

```text
de2c77862acd9095e0cccd9aa9fe609bfaf7d81ba1dd3ffac37de8c015570bfe
```
