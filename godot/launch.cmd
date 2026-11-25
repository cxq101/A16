@echo off
setlocal
if not defined A16_GODOT_EXE set "A16_GODOT_EXE=E:\tool\code\Godot471mono\Godot_v4.7.1-stable_mono_win64.exe"
if not exist "%A16_GODOT_EXE%" (
  echo Please set A16_GODOT_EXE to Godot 4.7.1 .NET executable.
  pause
  exit /b 1
)
pushd "%~dp0"
dotnet build A16Study.csproj --nologo --verbosity quiet
if errorlevel 1 (
  pause
  popd
  exit /b 1
)
start "" "%A16_GODOT_EXE%" --path .
popd
