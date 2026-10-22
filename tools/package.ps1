#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$OutputDirectory,
    [string]$PackageRoot
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'portable.ps1') -Library

if ([string]::IsNullOrWhiteSpace($PackageRoot)) { $PackageRoot = Split-Path -Parent $PSScriptRoot }
$PackageRoot = Get-HubAbsolutePath $PackageRoot
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) { $OutputDirectory = Join-Path $PackageRoot 'dist' }
$OutputDirectory = Get-HubAbsolutePath $OutputDirectory
$manifest = Read-HubJson (Join-Path $PackageRoot 'package.json')
if ($manifest.name -ne 'dsh-plugin-hub') { throw 'This script packages dsh-plugin-hub only.' }
if ($manifest.version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$') { throw 'The package version is not a portable release filename.' }
foreach ($required in @('lib\index.js', 'lib\client.js', 'cordis.patch.yml')) {
    if (-not (Test-Path -LiteralPath (Join-Path $PackageRoot $required) -PathType Leaf)) { throw ('Missing release file: ' + $required) }
}
if ($manifest.dependencies -and @($manifest.dependencies.PSObject.Properties).Count -gt 0) { throw 'A portable release must not require external runtime npm dependencies.' }

$outputRoot = Join-Path $PackageRoot 'tools\out'
Assert-HubNoLinkedAncestors $outputRoot $PackageRoot
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$stage = Assert-HubChildPath (Join-Path $outputRoot ('release-' + [Guid]::NewGuid().ToString('N'))) $outputRoot
New-Item -ItemType Directory -Path $stage | Out-Null
try {
    $pluginDir = Join-Path $stage 'plugin'
    New-Item -ItemType Directory -Path $pluginDir | Out-Null
    $files = @('package.json', 'cordis.patch.yml', 'lib', 'README.md', 'LICENSE')
    foreach ($declared in @($manifest.files)) {
        if ($declared -match '[*?]' -or [IO.Path]::IsPathRooted($declared) -or $declared -match '(^|[\\/])\.\.([\\/]|$)') { throw ('Unsupported release file declaration: ' + $declared) }
        if ($files -notcontains $declared) { $files += $declared }
    }
    foreach ($relative in $files) {
        $source = Assert-HubChildPath (Join-Path $PackageRoot $relative) $PackageRoot
        if (-not (Test-Path -LiteralPath $source)) { continue }
        if (Test-Path -LiteralPath $source -PathType Container) { Assert-HubTreeNoLinks $source }
        elseif (Test-HubReparsePoint $source) { throw ('A release file is a reparse point: ' + $source) }
        $destination = Assert-HubChildPath (Join-Path $pluginDir $relative) $pluginDir
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $destination -Recurse
    }
    $toolsDir = Join-Path $stage 'tools'
    New-Item -ItemType Directory -Path $toolsDir | Out-Null
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'portable.ps1') -Destination (Join-Path $toolsDir 'portable.ps1')
    $deliveryRoot = Join-Path $PackageRoot 'delivery'
    foreach ($entry in @(Get-ChildItem -LiteralPath $deliveryRoot -File)) {
        if ($entry.Extension -eq '.cmd') {
            $bytes = [IO.File]::ReadAllBytes($entry.FullName)
            if (@($bytes | Where-Object { $_ -gt 127 }).Count) { throw ('A CMD launcher contains non-ASCII bytes: ' + $entry.Name) }
            $text = [Text.Encoding]::ASCII.GetString($bytes).Replace("`r`n", "`n").Replace("`n", "`r`n")
            [IO.File]::WriteAllText((Join-Path $stage $entry.Name), $text, [Text.Encoding]::ASCII)
        } else { Copy-Item -LiteralPath $entry.FullName -Destination (Join-Path $stage $entry.Name) }
    }
    $requiredEntries = @('plugin/package.json', 'plugin/cordis.patch.yml', 'plugin/lib/index.js', 'plugin/lib/client.js', 'tools/portable.ps1')
    foreach ($launcher in @(Get-ChildItem -LiteralPath $deliveryRoot -File)) { $requiredEntries += $launcher.Name }
    $hashLines = @(Get-ChildItem -LiteralPath $stage -File -Recurse | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($stage.Length + 1).Replace('\', '/')
        (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $relative
    })
    Write-HubUtf8 (Join-Path $stage 'SHA256SUMS.txt') (($hashLines -join "`n") + "`n")
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $zipPath = Join-Path $OutputDirectory ($manifest.name + '-' + $manifest.version + '-win-x64.zip')
    if (Test-Path -LiteralPath $zipPath) { throw ('A release with this name already exists. Choose a new version or output directory: ' + $zipPath) }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    # .NET Framework's CreateFromDirectory can emit Windows backslashes in
    # entry names. Build each portable ZIP entry with an explicit slash path.
    $zipStream = [IO.File]::Open($zipPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try {
        $zipWriter = New-Object IO.Compression.ZipArchive($zipStream, [IO.Compression.ZipArchiveMode]::Create, $false)
        try {
            foreach ($file in @(Get-ChildItem -LiteralPath $stage -File -Recurse | Sort-Object FullName)) {
                $entryName = $file.FullName.Substring($stage.Length + 1).Replace('\', '/')
                $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipWriter, $file.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal)
            }
        } finally { $zipWriter.Dispose() }
    } finally { $zipStream.Dispose() }
    $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $names = @($archive.Entries | ForEach-Object { $_.FullName })
        if (@($names | Where-Object { $_.Contains('\') }).Count) { throw 'ZIP verification failed; entry names must use forward slashes.' }
        foreach ($required in $requiredEntries) { if ($names -notcontains $required) { throw ('ZIP verification failed; missing: ' + $required) } }
    } finally { $archive.Dispose() }
    $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-HubUtf8 ($zipPath + '.sha256.txt') ($hash + '  ' + [IO.Path]::GetFileName($zipPath) + "`n")
    [pscustomobject]@{ PackagePath = $zipPath; Sha256 = $hash; Bytes = (Get-Item -LiteralPath $zipPath).Length }
} finally {
    if (Test-Path -LiteralPath $stage) { Remove-HubOwnedDirectory $stage $outputRoot }
}
