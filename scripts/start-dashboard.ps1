[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)]
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies"
$runtimeNode = Join-Path $runtimeRoot "node\bin"
$runtimeFallback = Join-Path $runtimeRoot "bin\fallback"

if (Test-Path -LiteralPath $runtimeNode) {
    $env:PATH = "$runtimeNode;$runtimeFallback;$env:PATH"
}

$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpmCommand) {
    $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
}
if (-not $pnpmCommand) {
    throw "没有找到 pnpm。请先按 README 的本地启动章节安装 Node.js 24 和 pnpm 11。"
}

Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "node_modules"))) {
    throw "依赖尚未安装。请先在项目目录运行 pnpm install --frozen-lockfile。"
}

$localUrl = "http://localhost:$Port/"
$physicalAddresses = @(
    Get-NetAdapter -Physical -ErrorAction SilentlyContinue |
        Where-Object { $_.Status -eq "Up" } |
        Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*"
        } |
        Select-Object -ExpandProperty IPAddress -Unique
)
$phoneUrls = @($physicalAddresses | ForEach-Object { "http://$($_):$Port/" })
if ($physicalAddresses.Count -gt 0) {
    $env:NEXT_ALLOWED_DEV_ORIGINS = $physicalAddresses -join ","
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($listener) {
    try {
        $healthResponse = Invoke-WebRequest -UseBasicParsing -Uri $localUrl -TimeoutSec 3
        if ($healthResponse.StatusCode -eq 200 -and $healthResponse.Content.Contains("知势")) {
            Write-Host "知势看板已经在运行，正在打开浏览器……" -ForegroundColor Green
            Start-Process $localUrl
            Start-Sleep -Seconds 2
            return
        }
    }
    catch {
        # 端口存在监听，但不是可识别的知势页面；下面给出明确错误。
    }
    throw "端口 $Port 已被其他程序占用。请关闭占用程序后重新双击快捷方式。"
}

Write-Host ""
Write-Host "知势 · 每日研判与公考学习看板" -ForegroundColor Cyan
Write-Host "电脑访问：$localUrl" -ForegroundColor Green
if ($phoneUrls.Count -gt 0) {
    Write-Host "手机访问（手机与电脑需连接同一 Wi-Fi）：" -ForegroundColor Yellow
    $phoneUrls | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}
else {
    Write-Host "暂未检测到可供手机访问的物理网络地址。" -ForegroundColor Yellow
}
Write-Host "首次启动若出现 Windows 防火墙提示，只允许‘专用网络’即可。" -ForegroundColor DarkGray
Write-Host "关闭这个窗口或按 Ctrl+C 即可停止本地服务。" -ForegroundColor DarkGray
Write-Host ""

$helperScript = @"
`$targetUrl = '$localUrl'
for (`$attempt = 0; `$attempt -lt 45; `$attempt++) {
    try {
        `$response = Invoke-WebRequest -UseBasicParsing -Uri `$targetUrl -TimeoutSec 2
        if (`$response.StatusCode -eq 200) {
            Start-Process `$targetUrl
            exit 0
        }
    }
    catch {
    }
    Start-Sleep -Milliseconds 500
}
"@
$encodedHelper = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($helperScript))
$windowsPowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
Start-Process -FilePath $windowsPowerShell -ArgumentList "-NoLogo", "-NoProfile", "-EncodedCommand", $encodedHelper -WindowStyle Hidden

& $pnpmCommand.Source run dev:lan
if ($LASTEXITCODE -ne 0) {
    throw "本地服务异常退出，退出码：$LASTEXITCODE"
}
