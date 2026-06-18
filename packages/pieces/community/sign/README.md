# Sign

Signature électronique de documents PDF conforme **eIDAS / PAdES** : envoi à la
signature, vérification d'identité par SMS (OTP), suivi du statut, téléchargement
du PDF signé et récupération du certificat de preuve juridique.

API : `https://sign.layerone.fr` — authentification par clé API dans l'en-tête `X-API-Key`.

## Authentification

1. Créez un compte gratuit sur [dev.layerone.fr](https://dev.layerone.fr) (10 signatures offertes par mois).
2. Générez une clé Sign dans l'onglet « Clés API ».
3. Collez la clé dans la connexion.

## Actions

| Action | Description |
| --- | --- |
| Envoyer un document à signer | Envoie un PDF à signer (eIDAS / PAdES) et invite le signataire par email |
| Détecter les champs de signature | Analyse un PDF et retourne les emplacements balisés `[[...]]` |
| Télécharger le document signé | Récupère le PDF final signé (PAdES + certificat de preuve) |
| Annuler une demande de signature | Annule une demande encore en cours |
| Envoyer un code de vérification (SMS) | Envoie un code OTP par SMS au signataire |
| Vérifier un code de vérification (SMS) | Valide le code OTP et retourne l'URL de signature |
| Consulter le statut d'une signature | État d'avancement (en attente, signé, refusé…) |
| Récupérer le certificat de preuve | Certificat juridique complet (IP, horodatage, chaîne de hachage) |
| Vérifier l'intégrité de la signature | Vérification cryptographique de la signature PAdES |

## Build

```bash
turbo run build --filter='@activepieces/piece-sign'
turbo run lint --filter='@activepieces/piece-sign'
```
