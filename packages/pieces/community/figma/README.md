# pieces-figma

## Building

Run `turbo run build --filter=@activepieces/piece-figma` to build the library.

## Desenvolvimento local

Para usar esta piece a partir do código local (sem instalar do registry npm), configure a variável de ambiente:

```bash
AP_DEV_PIECES=figma
```

Assim a plataforma carrega a piece do projeto em vez de tentar instalar `@activepieces/figma` do npm.
