# Configura el respaldo automatico de Neon en esta PC (Programador de tareas de Windows).
# Ejecutar una sola vez, desde PowerShell, dentro de la carpeta del proyecto.
param(
    [string]$Destino = (Join-Path $env:USERPROFILE "Documents\Respaldos_Cotizaciones"),
    [string]$Hora = "12:00",
    [int]$Mantener = 60
)

$ErrorActionPreference = "Stop"
$base = $PSScriptRoot
$runner = Join-Path $base "respaldo_neon.ps1"
if (-not (Test-Path $runner)) { throw "No se encontro respaldo_neon.ps1 junto a este script." }

Write-Host "Carpeta de respaldos: $Destino"
Write-Host "Pega la cadena de conexion POOLED de Neon (no se mostrara en pantalla)."
$secure = Read-Host "DATABASE_URL" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
if ($plain -notmatch '^postgres(ql)?://') { throw "La cadena debe empezar con postgresql://" }

# Se guarda cifrada con DPAPI: solo este usuario de Windows en esta PC puede leerla.
$credDir = Join-Path $env:LOCALAPPDATA "CotizacionesBackup"
New-Item -ItemType Directory -Force -Path $credDir | Out-Null
$secure | ConvertFrom-SecureString | Set-Content -Path (Join-Path $credDir "neon.cred") -Encoding ASCII
$plain = $null

$argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -Destino `"$Destino`" -Mantener $Mantener -MinHoras 20"
$accion = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argumentos -WorkingDirectory $base
$disparadores = @(
    (New-ScheduledTaskTrigger -Daily -At $Hora),
    (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME)
)
$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable `
    -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName "Respaldo Cotizaciones Neon" -Action $accion -Trigger $disparadores `
    -Settings $config -Description "Respaldo logico diario de Neon hacia $Destino" -Force | Out-Null

Write-Host "Tarea creada: diaria a las $Hora y al iniciar sesion (omite si ya hay respaldo de las ultimas 20 h)."
Write-Host "Ejecutando un respaldo de prueba..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runner -Destino $Destino -Mantener $Mantener
Write-Host ""
Write-Host "Ultimas lineas del registro ($Destino\respaldo.log):"
Get-Content (Join-Path $Destino "respaldo.log") -Tail 5
