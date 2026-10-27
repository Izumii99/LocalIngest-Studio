$projectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $projectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Building LocalIngest Studio Standalone Single-File Executables" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Run Engine Automated Tests
Write-Host "`n[1/4] Running automated engine self-checks..." -ForegroundColor Yellow
npm run test:engine
if ($LASTEXITCODE -ne 0) {
    Write-Error "Automated engine self-checks failed! Build process aborted."
    exit 1
}

# 2. Clean previous build outputs completely
Write-Host "`n[2/4] Cleaning previous release folder..." -ForegroundColor Yellow
Remove-Item -Path "release" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Build & Package (Portable + NSIS Installer)
Write-Host "`n[3/4] Building Vite bundle and packaging standalone executables..." -ForegroundColor Yellow
npm run package:all
if ($LASTEXITCODE -ne 0) {
    Write-Error "Packaging failed!"
    exit 1
}

# 4. Cleanup intermediate unpacked folders and temp archives
Write-Host "`n[4/5] Purging unpacked folders and intermediate archives..." -ForegroundColor Yellow
Remove-Item -Path "release\win-unpacked" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "release\builder-debug.yml" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "release\*.7z" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "release\*.blockmap" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "release\*.yaml" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "release\*.yml" -Force -ErrorAction SilentlyContinue

# 5. Show Clean Results
Write-Host "`n[5/5] Build complete! Clean standalone executables in release\:" -ForegroundColor Green
Get-ChildItem -Path "release\*.exe" | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Write-Host " - $($_.Name) ($sizeMB MB)" -ForegroundColor White
}
Write-Host "`nAll-in-one release ready for distribution without folders!" -ForegroundColor Green
