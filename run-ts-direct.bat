@echo off
setlocal

echo Running TypeScript directly with tsx...
call npx tsx test-ts-esm.ts

if %ERRORLEVEL% NEQ 0 (
    echo Failed with error level %ERRORLEVEL%
    pause
)

endlocal
