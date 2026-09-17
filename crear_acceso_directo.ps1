$ErrorActionPreference = "Stop"
$url = "http://$env:COMPUTERNAME`:8765"
$desktop = [Environment]::GetFolderPath("CommonDesktopDirectory")
$shortcutPath = Join-Path $desktop "NT Tool Quotation Follow-up.lnk"
$edge = Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path -LiteralPath $edge)) {
    $edge = Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"
}
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $edge
$shortcut.Arguments = "--app=$url"
$shortcut.WorkingDirectory = Split-Path -Parent $edge
$shortcut.Description = "NT Tool Quotation Follow-up"
$shortcut.Save()
Write-Host "Shortcut created at $shortcutPath"
