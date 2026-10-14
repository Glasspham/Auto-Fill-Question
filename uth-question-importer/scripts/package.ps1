$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$outputPath = Join-Path (Split-Path -Parent $projectRoot) ("UTH-Question-Importer-v{0}.zip" -f $manifest.version)

$packageFiles = @(
  "manifest.json",
  "background.js",
  "page.js",
  "core.js",
  "dashboard.html",
  "dashboard.js",
  "theme-init.js",
  "style.css",
  "README.md",
  "logo.png",
  "logo_uth.png",
  "UTH-cau-hoi-mau.xlsx",
  "vendor/xlsx.full.min.js",
  "vendor/LICENSE"
)

foreach ($relativePath in $packageFiles) {
  $sourcePath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Thiếu file đóng gói: $relativePath"
  }
}

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open(
  $outputPath,
  [System.IO.Compression.ZipArchiveMode]::Create
)

try {
  foreach ($relativePath in $packageFiles) {
    $sourcePath = Join-Path $projectRoot $relativePath
    $entryName = $relativePath.Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $archive,
      $sourcePath,
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
}
finally {
  $archive.Dispose()
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($outputPath)
try {
  $entryNames = @($zip.Entries | ForEach-Object FullName)
  $missing = @($packageFiles | ForEach-Object { $_.Replace("\", "/") } | Where-Object { $_ -notin $entryNames })
  if ($missing.Count -gt 0) {
    throw "ZIP thiếu file: $($missing -join ', ')"
  }
}
finally {
  $zip.Dispose()
}

$sha256 = [System.Security.Cryptography.SHA256]::Create()
$zipStream = [System.IO.File]::OpenRead($outputPath)
try {
  $hashBytes = $sha256.ComputeHash($zipStream)
  $hash = ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
}
finally {
  $zipStream.Dispose()
  $sha256.Dispose()
}
Write-Host "Đã tạo: $outputPath"
Write-Host "Phiên bản: $($manifest.version) | Số file: $($packageFiles.Count)"
Write-Host "SHA-256: $hash"
