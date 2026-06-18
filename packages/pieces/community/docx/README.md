# DocX

Génère des documents (PDF / DOCX) et des factures électroniques **Factur-X**
(conformes à la réforme 2026) à partir de modèles Word, avec gestion de versions.

API : `https://docx.layerone.fr` — authentification par clé API dans l'en-tête `X-API-Key`.

## Authentification

1. Créez un compte gratuit sur [dev.layerone.fr](https://dev.layerone.fr) (20 documents offerts par mois).
2. Générez une clé DocX dans l'onglet « Clés API ».
3. Collez la clé dans la connexion.

## Actions

| Action | Description |
| --- | --- |
| Générer une facture Factur-X | Facture électronique PDF-A3 conforme 2026 à partir d'un modèle + données JSON |
| Générer un document | Document PDF ou DOCX à partir d'un modèle + données JSON |
| Déposer un modèle | Dépose un modèle Word `.docx` (balises `{{ ... }}`) |
| Mettre à jour un modèle | Remplace un modèle, archive automatiquement l'ancienne version |
| Restaurer une version de modèle | Restaure une version archivée comme version active |
| Télécharger un modèle | Récupère le `.docx` d'un modèle |
| Télécharger une version de modèle | Récupère le `.docx` d'une version archivée |
| Supprimer un modèle | Supprime un modèle et tout son historique |
| Trouver un modèle | Liste les modèles, filtre optionnel par nom |
| Lister les versions d'un modèle | Historique des versions archivées |
| Consulter le quota et l'usage | Plan, quota et statistiques d'usage de la clé |

## Build

```bash
turbo run build --filter='@activepieces/piece-docx'
turbo run lint --filter='@activepieces/piece-docx'
```
