@echo off
setlocal

set NODE_OPTIONS=--no-warnings
set TS_NODE_PROJECT=packages\cli\tsconfig.json

echo Running TypeScript with tsx...
call npx tsx packages\cli\src\index.ts pieces build

if %ERRORLEVEL% NEQ 0 (
    echo Failed with error level %ERRORLEVEL%
    pause
)

endlocal
