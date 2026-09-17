# Run this script once as Windows Administrator on the physical server.
$ErrorActionPreference = "Stop"
$appDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcher = Join-Path $appDirectory "iniciar_servidor.bat"
if (-not (Test-Path -LiteralPath $launcher)) { throw "Server launcher not found: $launcher" }

$taskName = "NT Tool Quotation Follow-up"
$action = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\cmd.exe" -Argument "/c `"$launcher`"" -WorkingDirectory $appDirectory
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 3650)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

if (-not (Get-NetFirewallRule -DisplayName $taskName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $taskName -Direction Inbound -Protocol TCP -LocalPort 8765 -Action Allow -Profile Domain,Private | Out-Null
}

& (Join-Path $appDirectory "crear_acceso_directo.ps1")
Start-ScheduledTask -TaskName $taskName
Write-Host "Server installation complete. Open http://$env:COMPUTERNAME`:8765"
