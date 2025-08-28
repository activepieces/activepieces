@echo off
setlocal

echo Running TypeScript with Node.js ESM loader...
call node --loader tsx/esm test-ts-esm.ts

if %ERRORLEVEL% NEQ 0 (
    echo Failed with error level %ERRORLEVEL%
    pause
)

endlocal
